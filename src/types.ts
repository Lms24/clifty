export type Actions = {
  whenAsked: InteractionBuilder["whenAsked"];
  expectOutput: InteractionBuilder["expectOutput"];
};

export interface ExpectOutputOptions {
  /**
   * The number of milliseconds to wait for the output to be emitted.
   * @default 5000 (5s)
   */
  timeout?: number;
}

export interface InteractionBuilder {
  whenAsked: (
    prompt: string,
    opts?: ExpectOutputOptions
  ) => {
    respondWith: (...response: string[]) => InteractionBuilder;
  };

  expectOutput: (
    output: string,
    opts?: ExpectOutputOptions
  ) => InteractionBuilder;

  step: (
    name: string,
    callback: (actions: Actions) => void
  ) => InteractionBuilder;

  run: (cmd: string) => Promise<number>;
}

type DefineInteraction = (
  actionCallback?: (actions: Actions & Pick<InteractionBuilder, "step">) => void
) => InteractionBuilder;

export interface TestEnv {
  cwd: string;
  env: Record<string, string | undefined>;
  debug: boolean;
  defineInteraction: DefineInteraction;
}
