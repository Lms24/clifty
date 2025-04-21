import { ScenarioBuilder } from "./scenarioBuilder.js";
import type { TestEnv as ITestEnv } from "./types.js";

interface TestEnvOptions {
  cwd?: string;
  env?: Record<string, string>;
  debug?: boolean;
}

export class TestEnv implements ITestEnv {
  #cwd: string;
  #env: Record<string, string | undefined>;
  #debug: boolean;

  constructor(options: TestEnvOptions) {
    this.#cwd = options.cwd ?? process.cwd();
    this.#env = options.env ?? { ...process.env };
    this.#debug = options.debug ?? false;
  }

  buildScenario(): Pick<
    ScenarioBuilder,
    "whenAsked" | "step" | "run" | "expectOutput"
  > {
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
