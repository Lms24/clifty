import { spawn } from "child_process";

interface TestEnvOptions {
  cwd?: string;
  env?: Record<string, string>;
  debug?: boolean;
}

export const KEYS = {
  UP: "\u001b[A",
  DOWN: "\u001b[B",
  LEFT: "\u001b[D",
  RIGHT: "\u001b[C",
  ENTER: "\r",
  SPACE: " ",
};

export class TestEnv {
  #cwd: string;
  #env: Record<string, string | undefined>;
  #debug: boolean;

  constructor(options: TestEnvOptions) {
    this.#cwd = options.cwd ?? process.cwd();
    this.#env = options.env ?? { ...process.env };
    this.#debug = options.debug ?? false;
  }

  buildScenario(): ScenarioBuilder {
    return new ScenarioBuilder(this);
  }

  get cwd(): string {
    return this.#cwd;
  }

  get env(): Record<string, string | undefined> {
    return this.#env;
  }

  get debug(): boolean {
    return this.#debug;
  }
}

const DEFAULT_STEP_TIMEOUT = 5000;

type Step = { id: number; promise: Promise<void> } & (
  | {
      type: "prompt";
      promptIndex: number;
    }
  | {
      type: "output";
    }
);

class ScenarioBuilder {
  #testEnv: TestEnv;

  #steps: Array<Step>;

  #stdoutBuffer: string;
  #stdErrBuffer: string;

  #outout: EventTarget;

  #promptCount = 0;
  #stepCount = 0;
  #promptResponses: Record<number, string | string[]>;

  constructor(testEnv: TestEnv) {
    this.#testEnv = testEnv;
    this.#steps = [];
    this.#stdoutBuffer = "";
    this.#stdErrBuffer = "";
    this.#promptResponses = {};
    this.#outout = new EventTarget();
  }

  on(
    stdout: string,
    opts?: { timeout?: number }
  ): Pick<ScenarioBuilder, "respondWith"> {
    const timeout = opts?.timeout ?? DEFAULT_STEP_TIMEOUT;

    this.#steps.push({
      id: this.#stepCount++,
      type: "prompt",
      promptIndex: this.#promptCount,
      promise: new Promise((resolve, reject) => {
        const timeoutTimeout = setTimeout(() => {
          reject(new Error(`Timeout while waiting on '${stdout}'`));
        }, timeout);

        const stdoutListener = () => {
          if (this.#stdoutBuffer.includes(stdout)) {
            clearTimeout(timeoutTimeout);
            resolve();
          }
        };

        this.#outout.addEventListener("stdout", stdoutListener);
      }),
    });

    return this;
  }

  respondWith(stdinResponse: string | string[]): ScenarioBuilder {
    this.#promptResponses[this.#promptCount] = stdinResponse;
    this.#promptCount++;
    return this;
  }

  expectOutput(output: string): ScenarioBuilder {
    throw new Error("Not implemented");
    return this;
  }

  async run(cmd: string): Promise<number> {
    if (this.#testEnv.debug) {
      console.log("Running", cmd);
      console.log("Steps:", JSON.stringify(this.#steps));
    }

    return new Promise(async (resolve, reject) => {
      if (this.#steps.length !== this.#promptCount) {
        reject(
          new Error(
            "Prompt count mismatch - did you add a `respondWith` to each `on`?"
          )
        );
      }

      const [command, ...args] = cmd.split(" ").map((arg) => arg.trim());

      const child = spawn(command, args, {
        cwd: this.#testEnv.cwd,
        env: this.#testEnv.env,
        stdio: "pipe",
      });

      if (this.#testEnv.debug) {
        child.stdout?.pipe(process.stdout);
        child.stderr?.pipe(process.stderr);
      }

      child.stdout.on("data", (data) => {
        this.#stdoutBuffer += data.toString();
        this.#outout.dispatchEvent(
          new CustomEvent("stdout", { detail: data.toString() })
        );
        if (this.#testEnv.debug) {
          console.log(this.#stdErrBuffer);
        }
      });

      child.stderr.on("data", (data) => {
        this.#stdErrBuffer += data.toString();
        this.#outout.dispatchEvent(
          new CustomEvent("stderr", { detail: data.toString() })
        );

        if (this.#testEnv.debug) {
          console.log(this.#stdErrBuffer);
        }
      });

      for (let i = 0; i < this.#steps.length; i++) {
        const step = this.#steps[i];
        await step.promise;
        if (step.type === "prompt") {
          const response = this.#promptResponses[step.promptIndex];
          if (Array.isArray(response)) {
            for (const r of response) {
              child.stdin.write(r);
            }
          } else {
            child.stdin.write(response);
          }
        }
      }

      child.on("close", (code) => {
        if (code === null) {
          reject(new Error("Process terminated without exit code"));
        } else {
          resolve(code);
        }
      });
    });
  }
}
