import { describe, it, expect, afterEach, afterAll } from "vitest";
import { KEYS, TestEnv } from "../src/index.js";
import { readFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { withEnv } from "../src/withEnv.js";

describe("NPM init", async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "clifty-npm-test"));

  afterAll(() => {
    // Clean up test directory
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const testbed = new TestEnv({
    cwd: tmpDir,
  });

  const exitCode = await testbed
    .defineInteraction()
    .whenAsked("package name:")
    .respondWith("testproject123", KEYS.ENTER)
    .whenAsked("version:")
    .respondWith("1.1.1", KEYS.ENTER)
    .whenAsked("description:")
    .respondWith(KEYS.ENTER)
    .whenAsked("entry point:")
    .respondWith("index.js", KEYS.ENTER)
    .whenAsked("test command:")
    .respondWith("vitest", KEYS.ENTER)
    .whenAsked("git repository:")
    .respondWith(KEYS.ENTER)
    .whenAsked("keywords:")
    .respondWith(KEYS.ENTER)
    .whenAsked("author:")
    .respondWith(KEYS.ENTER)
    .whenAsked("license:")
    .respondWith("MIT", KEYS.ENTER)
    .whenAsked("Is this OK?")
    .respondWith("yes", KEYS.ENTER)

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
          "test": "vitest"
        },
        "author": "",
        "license": "MIT",
        "description": ""
      }
      "
    `);
  });
});

describe("NPM init with steps", async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "clifty-npm-steps-test"));

  afterAll(() => {
    // Clean up test directory
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const exitCode = await withEnv({
    cwd: tmpDir,
  })
    .defineInteraction()
    .step("Give package a name", ({ whenAsked }) => {
      whenAsked("package name:").respondWith("testproject123", KEYS.ENTER);
    })
    .step("Additional information", ({ whenAsked }) => {
      whenAsked("version:").respondWith("1.1.1", KEYS.ENTER);
      whenAsked("description:").respondWith(KEYS.ENTER);
      whenAsked("entry point:").respondWith("index.js", KEYS.ENTER);
      whenAsked("test command:").respondWith("vitest", KEYS.ENTER);
    })
    .step("NPM registry metadata", ({ whenAsked }) => {
      whenAsked("git repository:").respondWith(KEYS.ENTER);
      whenAsked("keywords:").respondWith(KEYS.ENTER);
      whenAsked("author:").respondWith(KEYS.ENTER);
      whenAsked("license:").respondWith("MIT", KEYS.ENTER);
    })
    .step("Confirmation", ({ whenAsked }) => {
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
          "test": "vitest"
        },
        "author": "",
        "license": "MIT",
        "description": ""
      }
      "
    `);
  });
});

describe("NPM init with steps in defineInteraction", async () => {
  const tmpDir = mkdtempSync(join(tmpdir(), "clifty-npm-steps-test"));

  afterAll(() => {
    // Clean up test directory
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const exitCode = await withEnv({
    cwd: tmpDir,
  })
    .defineInteraction(({ step, whenAsked }) => {
      whenAsked("package name:").respondWith("testproject123", KEYS.ENTER);

      step("Additional information", ({ whenAsked }) => {
        whenAsked("version:").respondWith("1.1.1", KEYS.ENTER);
        whenAsked("description:").respondWith(KEYS.ENTER);
        whenAsked("entry point:").respondWith("index.js", KEYS.ENTER);
        whenAsked("test command:").respondWith("vitest", KEYS.ENTER);
      });

      step("NPM registry metadata", ({ whenAsked }) => {
        whenAsked("git repository:").respondWith(KEYS.ENTER);
        whenAsked("keywords:").respondWith(KEYS.ENTER);
        whenAsked("author:").respondWith(KEYS.ENTER);
        whenAsked("license:").respondWith("MIT", KEYS.ENTER);
      });

      step("Confirmation", ({ whenAsked }) => {
        whenAsked("Is this OK?").respondWith("yes", KEYS.ENTER);
      });
    })
    .expectOutput(
      `{
  "name": "testproject123",
  "version": "1.1.1",
  "main": "index.js",
  "scripts": {
      "test": "vitest"
  },
  "author": "",
  "license": "MIT",
  "description": ""
}`
    )
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
          "test": "vitest"
        },
        "author": "",
        "license": "MIT",
        "description": ""
      }
      "
    `);
  });
});

describe("NPM help", async () => {
  const tmpDir = tmpdir();

  const exitCode = await withEnv({
    cwd: tmpDir,
  })
    .defineInteraction()
    .expectOutput(
      `npm <command>

Usage:

npm install        install all the dependencies in your project
npm install <foo>  add the <foo> dependency to your project
npm test           run this project's tests
npm run <foo>      run the script named <foo>
npm <command> -h   quick help on <command>
npm -l             display usage info for all commands
npm help <term>    search for help on <term>
npm help npm       more involved overview

All commands:

    access, adduser, audit, bugs, cache, ci, completion,
    config, dedupe, deprecate, diff, dist-tag, docs, doctor,
    edit, exec, explain, explore, find-dupes, fund, get, help,
    help-search, hook, init, install, install-ci-test,
    install-test, link, ll, login, logout, ls, org, outdated,
    owner, pack, ping, pkg, prefix, profile, prune, publish,
    query, rebuild, repo, restart, root, run-script, sbom,
    search, set, shrinkwrap, star, stars, start, stop, team,
    test, token, uninstall, unpublish, unstar, update, version,
    view, whoami`
    )
    .run("npm --help");

  it("terminates with error", () => {
    // interestingly, npm --help terminates with an error code (TIL)
    expect(exitCode).toBe(1);
  });
});

describe("NPM version", async () => {
  const tmpDir = tmpdir();

  const exitCode = await withEnv({
    cwd: tmpDir,
  })
    .defineInteraction(({ expectOutput }) => {
      expectOutput("10");
    })
    .run("npm --version");

  it("terminates successfully", () => {
    expect(exitCode).toBe(0);
  });
});
