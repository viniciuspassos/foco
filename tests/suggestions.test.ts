import { describe, expect, it } from "vitest";

import {
  BrowserSuggestionProvider,
  parseSuggestedSteps,
  type PromptSession,
} from "../src/suggestions";

class AvailablePromptSession implements PromptSession {
  async prompt(): Promise<string> {
    return "1. Read the acceptance criteria\n2. Implement the smallest change\n3. Run the focused tests";
  }
}

describe("suggestion generation", () => {
  it("parses a numbered AI response into concise steps", () => {
    expect(
      parseSuggestedSteps(
        "1. **Define scope**\n2. Build the change\n3. Verify behavior",
      ),
    ).toEqual(["Define scope", "Build the change", "Verify behavior"]);
  });

  it("returns browser suggestions through a project-owned provider", async () => {
    const provider = new BrowserSuggestionProvider({
      availability: async () => "available",
      create: async () => new AvailablePromptSession(),
    });

    await expect(
      provider.suggest("Build the billing feature", "TypeScript web app"),
    ).resolves.toEqual([
      "Read the acceptance criteria",
      "Implement the smallest change",
      "Run the focused tests",
    ]);
  });

  it("explains when the local browser model is unavailable", async () => {
    const provider = new BrowserSuggestionProvider({
      availability: async () => "unavailable",
      create: async () => new AvailablePromptSession(),
    });

    await expect(provider.suggest("Build a feature", "")).rejects.toThrow(
      "Local AI suggestions are unavailable in this browser.",
    );
  });
});
