import { ScenarioBuilder } from "./scenarioBuilder.js";
import type {
  Actions,
  InteractionBuilder,
  TestEnv as ITestEnv,
} from "./types.js";

interface TestEnvOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
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

  defineInteraction(
    actionCallback?: (
      actions: Actions & Pick<InteractionBuilder, "step">
    ) => void
  ): InteractionBuilder {
    const builder = new ScenarioBuilder(this);

    if (actionCallback) {
      actionCallback({
        whenAsked: builder.whenAsked.bind(builder),
        expectOutput: builder.expectOutput.bind(builder),
        step: builder.step.bind(builder),
      });
    }

    return builder;
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
