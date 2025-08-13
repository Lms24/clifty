import { describe, it, expect } from "vitest";
import { KEYS, withEnv } from "../src";

describe("clifty with picocolors", () => {
  it("handles colorized and ansi-formatted output", async () => {
    const result = await withEnv({ debug: true })
      .defineInteraction()
      .expectOutput(
        "This is a simple flow for testing output with colorized and formatted output"
      )
      .whenAsked("What is your name?")
      .respondWith("H4cktor", KEYS.ENTER)
      .expectOutput("Hello H4cktor (clack.log.success)")
      .expectOutput("Hello H4cktor (clack.log.info)")
      .expectOutput("Hello H4cktor (clack.log.error)")
      .expectOutput("Hello H4cktor (clack.log.warn)")
      .expectOutput("Hello H4cktor (red)")
      .expectOutput("Hello H4cktor (red + bg)")
      .expectOutput("Hello H4cktor (italic + bg)")
      .expectOutput("greeting H4cktor in progress")
      .expectOutput("greeting H4cktor in progress 50%")
      .expectOutput("Greeted H4cktor")
      .expectOutput("Goodbye")
      .run("node test/testcli/bin.mjs picocolors");

    expect(result).toBe(0);
  });
});
