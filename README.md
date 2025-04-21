# Clifty

The nifty CLI execution, interaction and testing tool

**WARNING**: API design still work in progress, expect breaking changes!

## About

Clifty is small and nifty abstraction layer around invoking and interacting with
command line interfaces or tools.

Some areas of application:

- CLI E2E testing (original purpose)
- Interacting with tools that don't offer a programmatic API
- You tell me :)

## Install

```bash
npm install clifty
#or
yarn add clifty
#or
pnpm add clifty
```

## Usage

```js
import { TestEnv } from "clifty";

const cliEnv = new TestEnv({
  cwd: "./bin",
  env: {
    FOO: "bar",
  },
});

const exitCode = await cliEnv
  .buildScenario()
  .whenAsked("what's your name?")
  .respondWith("hacktor", KEYS.ENTER)
  .run("./hello-world");

console.log(exitCode);
```

### Testing example (with `vitest`)

```ts
describe("NPM init with steps", async () => {
  const tmpDir = tmpdir();

  const testbed = new TestEnv({
    cwd: tmpDir,
  });

  const exitCode = await testbed
    .buildScenario()
    .step("Give package a name", (whenAsked) => {
      whenAsked("package name:").respondWith("testproject123", KEYS.ENTER);
    })
    .step("Additional information", (whenAsked) => {
      whenAsked("version:").respondWith("1.1.1", KEYS.ENTER);
      whenAsked("description:").respondWith(KEYS.ENTER);
    })
    .step("NPM registry metadata", (whenAsked) => {
      whenAsked("git repository:").respondWith(KEYS.ENTER);
      whenAsked("keywords:").respondWith(KEYS.ENTER);
      whenAsked("author:").respondWith(KEYS.ENTER);
      whenAsked("license:").respondWith("MIT", KEYS.ENTER);
    })
    .step("Confirmation", (whenAsked) => {
      whenAsked("Is this OK?").respondWith("yes", KEYS.ENTER);
    })
    .run("npm init");

  it("terminates successfully", () => {
    expect(exitCode).toBe(0);
  });

  it("package.json contains the valid entries", () => {
    expect(readFileSync(join(tmpDir, "package.json")).toString())
      .toMatchInlineSnapshot(`
      "{
        "name": "testproject123",
        "version": "1.1.1",
        "main": "index.js",
        "scripts": {
          "test": "echo \\"Error: no test specified\\" && exit 1"
        },
        "author": "",
        "license": "MIT",
        "description": ""
      }
      "
    `);
  });
});
```
