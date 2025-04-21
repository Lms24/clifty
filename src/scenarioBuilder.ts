import { spawn } from "child_process";
import { TestEnv } from "./types.js";
import { time } from "console";

const DEFAULT_STEP_TIMEOUT = 5000;

type Step = { id: number; timeout?: number } & (
  | {
      type: "prompt";
      promptIndex: number;
      output: string;
      timeout?: number;
    }
  | {
      type: "output";
      output: string;
    }
);

export class ScenarioBuilder {
  #testEnv: TestEnv;

  #steps: Array<Step>;

  #stdoutBuffer: string;
  #stdErrBuffer: string;

  output: EventTarget;

  #promptCount = 0;
  #stepCount = 0;
  #promptResponses: Record<number, string | string[]>;

  constructor(testEnv: TestEnv) {
    this.#testEnv = testEnv;
    this.#steps = [];
    this.#stdoutBuffer = "";
    this.#stdErrBuffer = "";
    this.#promptResponses = {};
    this.output = new EventTarget();
  }

  /**
   * Wait for the specific `stdout` CLI output that expects a `stdin` response.
   *
   * @param stdout - The specific `stdout` CLI output that expects a `stdin` response.
   * @param opts - Optional timeout (default is 5 seconds).
   */
  whenAsked(
    stdout: string,
    opts?: { timeout?: number }
  ): Pick<ScenarioBuilder, "respondWith"> {
    this.#steps.push({
      id: this.#stepCount++,
      type: "prompt",
      promptIndex: this.#promptCount,
      timeout: opts?.timeout,
      output: stdout,
    });

    return this;
  }

  /**
   * Respond to the last `whenAsked` prompt via `stdin`.
   *
   * @param stdinResponse - The response to the last `whenAsked` prompt.
   */
  respondWith(
    ...stdinResponse: string[]
  ): Pick<ScenarioBuilder, "whenAsked" | "step" | "expectOutput" | "run"> {
    this.#promptResponses[this.#promptCount] = stdinResponse;
    this.#promptCount++;
    return this;
  }

  /**
   * Expect the specific `stdout` CLI output.
   *
   * Fails if the output is not observed until the default timeout,
   * or the overridden specified timeout.
   *
   * @param stdout - The specific `stdout` CLI output to expect.
   * @param opts - Optional timeout (default is 5 seconds).
   */
  expectOutput(output: string, opts?: { timeout?: number }): ScenarioBuilder {
    this.#steps.push({
      id: this.#stepCount++,
      type: "output",
      output,
      timeout: opts?.timeout,
    });
    return this;
  }

  /**
   * Group individual interactions into a named step.
   *
   * This is completely optional, you can also just use `whenAsked` directly.
   *
   * @param name - The name of the step.
   * @param stepCallback - A function that will be called with a function to handle prompts.
   */
  step(
    name: string,
    stepCallback: (whenAsked: ScenarioBuilder["whenAsked"]) => void
  ): Pick<ScenarioBuilder, "whenAsked" | "step" | "run"> {
    try {
      stepCallback(this.whenAsked.bind(this));
    } catch (e) {
      throw new Error(`Error in step '${name}', ${e}`);
    }
    return this;
  }

  async run(cmd: string): Promise<number> {
    if (this.#testEnv.debug) {
      console.log("Running", cmd);
      console.log("Steps:", JSON.stringify(this.#steps));
    }

    return new Promise(async (resolve, reject) => {
      if (
        this.#steps.filter((s) => s.type === "prompt").length !==
        this.#promptCount
      ) {
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
        this.output.dispatchEvent(
          new CustomEvent("stdout", { detail: data.toString() })
        );
        if (this.#testEnv.debug) {
          console.log(this.#stdErrBuffer);
        }
      });

      child.stderr.on("data", (data) => {
        this.#stdErrBuffer += data.toString();
        this.output.dispatchEvent(
          new CustomEvent("stderr", { detail: data.toString() })
        );

        if (this.#testEnv.debug) {
          console.log(this.#stdErrBuffer);
        }
      });

      for (let i = 0; i < this.#steps.length; i++) {
        const step = this.#steps[i];

        try {
          await this.#waitForOutput(step);
        } catch {
          reject(
            new Error(
              `Timeout waiting on ${
                step.type === "prompt" ? "prompt" : "output"
              }. 
Waiting for: 
${step.output}

Reveived: 
${this.#stdoutBuffer}`
            )
          );
        }

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

      child.on("close", (exitCode) => {
        if (exitCode === null) {
          reject(new Error("Process terminated without exit code"));
        } else {
          resolve(exitCode);
        }
      });
    });
  }

  #waitForOutput(step: Step): Promise<void> {
    const { output, timeout } = step;

    const actualTimeout = timeout ?? DEFAULT_STEP_TIMEOUT;

    return new Promise((resolve, reject) => {
      const timeoutTimeout = setTimeout(() => {
        reject(new Error(`Timeout while waiting on '${output}'`));
      }, actualTimeout);

      const stdoutListener = () => {
        if (this.#stdoutBuffer.includes(output)) {
          clearTimeout(timeoutTimeout);
          this.output.removeEventListener("stdout", stdoutListener);
          resolve();
        }
      };

      this.output.addEventListener("stdout", stdoutListener);
    });
  }
}
