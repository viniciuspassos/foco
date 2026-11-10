// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import type { PromptModel, PromptSession } from "../src/suggestions";

class DeferredPromptSession implements PromptSession {
  resolveResponse!: (response: string) => void;
  readonly response = new Promise<string>((resolve) => {
    this.resolveResponse = resolve;
  });
  prompt(): Promise<string> {
    return this.response;
  }
}

class DownloadablePromptModel implements PromptModel {
  readonly sessions = [
    new DeferredPromptSession(),
    new DeferredPromptSession(),
  ];
  created = 0;
  async availability(): Promise<"downloadable"> {
    return "downloadable";
  }
  async create(): Promise<PromptSession> {
    const session = this.sessions[this.created++];
    if (!session) throw new Error("Unexpected duplicate session");
    return session;
  }
}

function element<T extends HTMLElement>(
  selector: string,
  container: ParentNode = document,
): T {
  const match = container.querySelector<T>(selector);
  if (!match) throw new Error(`Expected an element matching ${selector}`);
  return match;
}

function addTask(title: string): HTMLElement {
  const form = element<HTMLFormElement>('form[data-form="task"]');
  element<HTMLInputElement>('[name="title"]', form).value = title;
  form.requestSubmit();
  return element<HTMLElement>(".task-card");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  document.body.replaceChildren();
});

it("starts the first download, keeps overlapping drafts with their tasks, and preserves typing", async () => {
  const model = new DownloadablePromptModel();
  vi.stubGlobal("LanguageModel", model);
  document.body.innerHTML = '<main id="app"></main>';
  await import("../src/main");

  element<HTMLButtonElement>(
    '[data-action="suggest-steps"]',
    addTask("First"),
  ).click();
  element<HTMLButtonElement>('[data-action="suggest-steps"]').click();
  element<HTMLButtonElement>(
    '[data-action="suggest-steps"]',
    addTask("Second"),
  ).click();
  const title = element<HTMLInputElement>('[name="title"]');
  title.value = "Unsaved third task";
  title.focus();
  title.setSelectionRange(2, 6);
  await vi.waitFor(() => expect(model.created).toBe(2));

  model.sessions[1].resolveResponse("1. Review the second task");
  model.sessions[0].resolveResponse("1. Review the first task");
  await vi.waitFor(() => {
    const drafts = [
      ...document.querySelectorAll<HTMLInputElement>('[name="suggestion"]'),
    ];
    expect(drafts.map((draft) => draft.value)).toEqual([
      "Review the second task",
      "Review the first task",
    ]);
  });
  const preservedTitle = element<HTMLInputElement>('[name="title"]');
  expect(preservedTitle.value).toBe("Unsaved third task");
  expect(document.activeElement).toBe(preservedTitle);
  expect(preservedTitle.selectionStart).toBe(2);
  expect(preservedTitle.selectionEnd).toBe(6);
});
