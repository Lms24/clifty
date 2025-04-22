export interface InteractionBuilder {
  whenAsked: (
    prompt: string,
    opts?: { timeout?: number }
  ) => Pick<InteractionBuilder, "respondWith">;

  respondWith: (
    ...response: string[]
  ) => Omit<InteractionBuilder, "respondWith">;

  expectOutput: (output: string) => Omit<InteractionBuilder, "respondWith">;

  step: (
    name: string,
    callback: (whenAsked: InteractionBuilder["whenAsked"]) => void
  ) => Omit<InteractionBuilder, "respondWith">;

  run: (cmd: string) => Promise<number>;
}

export interface TestEnv {
  cwd: string;
  env: Record<string, string | undefined>;
  debug: boolean;
  defineInteraction: () => Pick<
    InteractionBuilder,
    "whenAsked" | "expectOutput" | "run" | "step"
  >;
}
