export interface TestEnv {
  cwd: string;
  env: Record<string, string | undefined>;
  debug: boolean;
}
