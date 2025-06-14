<div align="center">
  <img width="300" height="300" src="./doc/clifty-logo.png" />
</div>

> Your CLI's nifty new best friend. Declarative CLI orchestration made easy.

**WARNING**: API design still work in progress, expect breaking changes!

## About

**Clifty** lets you script flows through CLI apps using a clean, readable, and high-level API.
Whether you're writing end-to-end tests or embedding CLI behavior into your app, Clifty makes interacting with child processes a breeze.

## ✨ Features

- 🧠 **Declarative**: Define expected outputs and matching inputs in a readable chain.
- 🧪 **Test-Friendly**: Use with Jest, Vitest, or any test runner.
- 🔧 **The Last Resort**: Interact with tools that don't offer a programmatic API

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
  .expectOutput("Hello hacktor")
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

  it("writes the correct `package.json` entries", () => {
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

## Contributing

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing. When contributing to this project, please follow these guidelines:

### Adding Changes

When you make changes that should be released, you need to add a changeset:

1. Run `pnpm changeset` in the root of the repository
2. Select the packages that should be bumped
3. Select the type of version bump (patch, minor, or major)
4. Write a summary of the changes
5. Commit the generated changeset file along with your changes

### Changeset Types

- **Patch**: Bug fixes and minor updates that don't change the API
- **Minor**: New features that don't break existing functionality
- **Major**: Breaking changes that require users to modify their code

### Release Process

Releases are managed through GitHub Actions:

1. **PR Review**: Every PR must include a changeset. A GitHub Action will check this automatically.
2. **Version Bump**: Maintainers can manually trigger the "Release (Manual)" GitHub Action with the "version" option to create a version bump PR.
3. **Publishing**: After the version bump PR is merged, maintainers can trigger the "Release (Manual)" GitHub Action with the "publish" option to publish to npm.

This process ensures controlled releases and proper versioning based on the changes made.
