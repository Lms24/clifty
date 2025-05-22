import { spawn } from "child_process";
import { Actions, InteractionBuilder, TestEnv } from "./types.js";

const DEFAULT_STEP_TIMEOUT = 10_000;

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

export class ScenarioBuilder implements InteractionBuilder {
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
  ): {
    respondWith: (...response: string[]) => InteractionBuilder;
  } {
    this.#steps.push({
      id: this.#stepCount++,
      type: "prompt",
      promptIndex: this.#promptCount,
      timeout: opts?.timeout,
      output: stdout,
    });

    return {
      respondWith: (...response: string[]) => {
        this.#promptResponses[this.#promptCount] = response;
        this.#promptCount++;
        return this;
      },
    };
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
  expectOutput(
    output: string,
    opts?: { timeout?: number }
  ): InteractionBuilder {
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
    stepCallback: (actions: Actions) => void
  ): InteractionBuilder {
    try {
      stepCallback({
        whenAsked: this.whenAsked.bind(this),
        expectOutput: this.expectOutput.bind(this),
      });
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

      child.on("close", (exitCode) => {
        if (exitCode === null) {
          reject(new Error("Process terminated without exit code"));
        } else {
          resolve(exitCode);
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

      child.stdin.destroy();
      child.stdin.destroy();
      child.stdout.destroy();
      child.unref();
    });
  }

  #waitForOutput(step: Step): Promise<void> {
    const { output, timeout } = step;

    const actualTimeout = timeout ?? DEFAULT_STEP_TIMEOUT;

    return new Promise((resolve, reject) => {
      const timeoutTimeout = setTimeout(() => {
        reject(new Error(`Timeout while waiting on '${output}'`));
      }, actualTimeout);

      let addedListener = false;

      const checkStdout = () => {
        if (this.#stdoutBuffer.includes(output)) {
          clearTimeout(timeoutTimeout);
          if (addedListener) {
            this.output.removeEventListener("stdout", checkStdout);
          }
          resolve();
        }
      };

      // invoke the check once immediately, in case the output was already emitted
      // and the CLI blocks further emissions (e.g. because waiting on input)
      checkStdout();

      this.output.addEventListener("stdout", checkStdout);
      addedListener = true;
    });
  }
}
