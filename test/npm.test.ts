import { describe, it, expect, vi, afterAll } from "vitest";
import { KEYS, TestEnv } from "../src/index.js";
import { existsSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("NPM init", async () => {
  const tmpDir = tmpdir();

  const testbed = new TestEnv({
    cwd: tmpDir,
    debug: true,
  });

  const code = await testbed
    .buildScenario()
    .on("package name:")
    .respondWith(["testproject123", KEYS.ENTER])
    .on("version:")
    .respondWith(["1.1.1", KEYS.ENTER])
    .on("description:")
    .respondWith(KEYS.ENTER)
    .on("git repository:")
    .respondWith(KEYS.ENTER)
    .on("keywords:")
    .respondWith(KEYS.ENTER)
    .on("author:")
    .respondWith(KEYS.ENTER)
    .on("license:")
    .respondWith(["MIT", KEYS.ENTER])
    .on("Is this OK?")
    .respondWith(["yes", KEYS.ENTER])
    .run("npm init");

  it("terminates successfully", () => {
    expect(code).toBe(0);
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
