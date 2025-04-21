import { describe, it, expect, vi, afterAll } from "vitest";
import { KEYS, TestEnv } from "../src/index.js";
import { existsSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("NPM init", async () => {
  const tmpDir = tmpdir();

  const testbed = new TestEnv({
    cwd: tmpDir,
  });

  const exitCode = await testbed
    .buildScenario()
    .whenAsked("package name:")
    .respondWith("testproject123", KEYS.ENTER)
    .whenAsked("version:")
    .respondWith("1.1.1", KEYS.ENTER)
    .whenAsked("description:")
    .respondWith(KEYS.ENTER)
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
