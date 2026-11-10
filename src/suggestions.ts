export type BrowserModelAvailability =
  "available" | "downloadable" | "downloading" | "unavailable";

export interface PromptSession {
  prompt(request: string): Promise<string>;
  destroy?(): void;
}

export interface PromptModel {
  availability(): Promise<BrowserModelAvailability>;
  create(): Promise<PromptSession>;
}

export interface SuggestionProvider {
  suggest(title: string, note: string): Promise<string[]>;
}

export class BrowserSuggestionProvider implements SuggestionProvider {
  constructor(private readonly promptModel: PromptModel) {}

  async suggest(title: string, note: string): Promise<string[]> {
    const availability = await this.promptModel.availability();
    if (availability === "unavailable")
      throw new Error("Local AI suggestions are unavailable in this browser.");
    const session = await this.promptModel.create();
    try {
      return parseSuggestedSteps(
        await session.prompt(buildSuggestionPrompt(title, note)),
      );
    } finally {
      session.destroy?.();
    }
  }
}

export function parseSuggestedSteps(response: string): string[] {
  return response.split("\n").map(cleanStep).filter(isValidStep).slice(0, 6);
}

export function getBrowserSuggestionProvider(): SuggestionProvider | null {
  const promptModel = globalThis.LanguageModel;
  return promptModel === undefined
    ? null
    : new BrowserSuggestionProvider(promptModel);
}

function buildSuggestionPrompt(title: string, note: string): string {
  return `Break this task into exactly 4 short, concrete, independently checkable steps. Start every step with a verb. Keep existing behavior safe when the context mentions it. Do not introduce tools, libraries, services, or architecture that are not named in the task or context. Respond with only a numbered plain-text list. Do not use Markdown.\nTask: ${title}\nContext: ${note || "No additional context."}`;
}

function cleanStep(line: string): string {
  return line
    .replace(/^\s*(?:\d+[.)]|[-*])\s*/, "")
    .replaceAll("**", "")
    .trim();
}

function isValidStep(step: string): boolean {
  return step.length > 2 && step.length <= 120;
}

declare global {
  interface Window {
    LanguageModel?: PromptModel;
  }

  var LanguageModel: PromptModel | undefined;
}
