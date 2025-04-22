import { TestEnv } from "./types.js";
import { TestEnv as TestEnvClass } from "./testEnv.js";

export function withEnv(env: Partial<TestEnv>): TestEnv {
  return new TestEnvClass({
    ...env,
    env: { ...env.env, ...process.env },
  });
}
