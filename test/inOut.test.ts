import { describe, it, expect } from "vitest";
import { KEYS, withEnv } from "../src";

describe("Simple input and output", () => {
  it("exits with a success code", async () => {
    const result = await withEnv({})
      .defineInteraction()
      .expectOutput("This is a simple flow for testing input and output")
      .whenAsked("What is your name?")
      .respondWith("John", KEYS.ENTER)
      .expectOutput("Hello John")
      .run("node test/testcli/bin.mjs inOut");

    expect(result).toBe(0);
  });
});
