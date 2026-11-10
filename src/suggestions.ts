export type BrowserModelAvailability =
  "available" | "downloadable" | "downloading" | "unavailable";

export interface PromptSession {
  prompt(request: string): Promise<string>;
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
    if (availability !== "available")
      throw new Error(suggestionError(availability));
    const session = await this.promptModel.create();
    return parseSuggestedSteps(
      await session.prompt(buildSuggestionPrompt(title, note)),
    );
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

function suggestionError(availability: BrowserModelAvailability): string {
  if (availability === "downloadable")
    return "Local AI is ready to download. Try again after Chrome finishes preparing it.";
  if (availability === "downloading")
    return "Local AI is downloading in Chrome. Try again in a moment.";
  return "Local AI suggestions are unavailable in this browser.";
}

declare global {
  interface Window {
    LanguageModel?: PromptModel;
  }

  var LanguageModel: PromptModel | undefined;
}
