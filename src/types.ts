export type Actions = {
  whenAsked: InteractionBuilder["whenAsked"];
  expectOutput: InteractionBuilder["expectOutput"];
};

export interface InteractionBuilder {
  whenAsked: (
    prompt: string,
    opts?: { timeout?: number }
  ) => {
    respondWith: (...response: string[]) => InteractionBuilder;
  };

  expectOutput: (output: string) => InteractionBuilder;

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
