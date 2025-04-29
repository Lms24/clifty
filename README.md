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

We use [Conventional Commits](https://www.conventionalcommits.org/) for our commit messages. This helps us automatically generate changelogs and determine version bumps. Please follow these guidelines when contributing:

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

#### Examples

```bash
feat(cli): add support for npm init testing
fix(test): handle npm prompts consistently
docs: update README with contribution guidelines
```

### Release Process

Releases are automated based on conventional commits. When you push to main:

1. The CI will check for conventional commits
2. If found, it will:
   - Update the version in package.json
   - Update the CHANGELOG.md
   - Create a git tag
   - Create a GitHub release
   - Publish to npm

No manual steps are required for releases!
