import "./styles.css";

import {
  addStep,
  createTask,
  isCompleted,
  removeTask,
  replaceTask,
  taskProgress,
  toggleStep,
  updateTask,
  type FocusTask,
} from "./tasks";
import { getBrowserSuggestionProvider } from "./suggestions";

interface AppState {
  tasks: FocusTask[];
  editingTaskId: string | null;
  suggestedSteps: string[];
  statusMessage: string;
}

const application = findApplicationContainer();
const suggestionProvider = getBrowserSuggestionProvider();
const state: AppState = {
  tasks: [],
  editingTaskId: null,
  suggestedSteps: [],
  statusMessage: "",
};

application.addEventListener("click", handleClick);
application.addEventListener("submit", handleSubmit);
renderApplication();

function handleClick(event: MouseEvent): void {
  const actionElement =
    event.target instanceof Element
      ? event.target.closest<HTMLElement>("[data-action]")
      : null;
  if (actionElement === null) return;
  const action = actionElement.dataset.action;
  if (action === "cancel-edit") resetEditor();
  if (action === "edit-task") beginTaskEdit(actionElement.dataset.taskId);
  if (action === "remove-task")
    removeSelectedTask(actionElement.dataset.taskId);
  if (action === "toggle-step")
    toggleSelectedStep(
      actionElement.dataset.taskId,
      actionElement.dataset.stepId,
    );
  if (action === "suggest-steps") void suggestSteps();
  if (action === "discard-suggestions") discardSuggestions();
}

function handleSubmit(event: SubmitEvent): void {
  event.preventDefault();
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (form?.dataset.form === "task") saveTask(form);
  if (form?.dataset.form === "step") addManualStep(form);
  if (form?.dataset.form === "suggestions") acceptSuggestions(form);
}

function saveTask(form: HTMLFormElement): void {
  const title = readRequiredField(form, "title");
  if (title === null) return;
  const note = readOptionalField(form, "note");
  const task =
    state.editingTaskId === null
      ? createTask(title, note, createIdentifier)
      : editExistingTask(title, note);
  if (task === null) return;
  state.tasks =
    state.editingTaskId === null
      ? [task, ...state.tasks]
      : replaceTask(state.tasks, task);
  resetEditor();
}

function editExistingTask(title: string, note: string): FocusTask | null {
  const task = state.tasks.find((item) => item.id === state.editingTaskId);
  return task === undefined ? null : updateTask(task, title, note);
}

function addManualStep(form: HTMLFormElement): void {
  const stepText = readRequiredField(form, "step");
  const taskId = form.dataset.taskId;
  if (stepText === null || taskId === undefined) return;
  updateTaskSteps(taskId, (task) => addStep(task, stepText, createIdentifier));
  renderApplication();
}

function acceptSuggestions(form: HTMLFormElement): void {
  const taskId = form.dataset.taskId;
  if (taskId === undefined) return;
  const inputs = [
    ...form.querySelectorAll<HTMLInputElement>("input[name='suggestion']"),
  ];
  const texts = inputs
    .map((input) => input.value.trim())
    .filter((text) => text.length > 0);
  updateTaskSteps(taskId, (task) =>
    texts.reduce(
      (updated, text) => addStep(updated, text, createIdentifier),
      task,
    ),
  );
  state.suggestedSteps = [];
  renderApplication();
}

async function suggestSteps(): Promise<void> {
  const activeTask = getActiveTask();
  if (activeTask === null || suggestionProvider === null) {
    state.statusMessage =
      "Local AI suggestions are unavailable in this browser.";
    renderApplication();
    return;
  }
  state.statusMessage = "Creating suggestions locally…";
  renderApplication();
  try {
    state.suggestedSteps = await suggestionProvider.suggest(
      activeTask.title,
      activeTask.note,
    );
    state.statusMessage =
      state.suggestedSteps.length === 0
        ? "No usable suggestions were returned. Add a step manually."
        : "Review the suggested steps before adding them.";
  } catch (error: unknown) {
    state.statusMessage =
      error instanceof Error ? error.message : "Could not create suggestions.";
  }
  renderApplication();
}

function beginTaskEdit(taskId: string | undefined): void {
  state.editingTaskId = taskId ?? null;
  state.suggestedSteps = [];
  state.statusMessage = "";
  renderApplication();
}

function removeSelectedTask(taskId: string | undefined): void {
  if (taskId === undefined) return;
  state.tasks = removeTask(state.tasks, taskId);
  if (state.editingTaskId === taskId) state.editingTaskId = null;
  state.suggestedSteps = [];
  renderApplication();
}

function toggleSelectedStep(
  taskId: string | undefined,
  stepId: string | undefined,
): void {
  if (taskId === undefined || stepId === undefined) return;
  updateTaskSteps(taskId, (task) => toggleStep(task, stepId));
  renderApplication();
}

function updateTaskSteps(
  taskId: string,
  update: (task: FocusTask) => FocusTask,
): void {
  const task = state.tasks.find((item) => item.id === taskId);
  if (task !== undefined) state.tasks = replaceTask(state.tasks, update(task));
}

function resetEditor(): void {
  state.editingTaskId = null;
  state.suggestedSteps = [];
  state.statusMessage = "";
  renderApplication();
}

function discardSuggestions(): void {
  state.suggestedSteps = [];
  state.statusMessage = "";
  renderApplication();
}

function getActiveTask(): FocusTask | null {
  if (state.editingTaskId === null) return state.tasks[0] ?? null;
  return state.tasks.find((task) => task.id === state.editingTaskId) ?? null;
}

function readRequiredField(form: HTMLFormElement, name: string): string | null {
  const input = form.elements.namedItem(name);
  const value =
    input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement
      ? input.value.trim()
      : "";
  return value.length === 0 ? null : value;
}

function readOptionalField(form: HTMLFormElement, name: string): string {
  const input = form.elements.namedItem(name);
  return input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement
    ? input.value.trim()
    : "";
}

function createIdentifier(): string {
  return crypto.randomUUID();
}

function findApplicationContainer(): HTMLElement {
  const container = document.querySelector<HTMLElement>("#app");
  if (container === null)
    throw new Error("Expected the application container '#app' to exist.");
  return container;
}

function renderApplication(): void {
  application.innerHTML = `<div class="shell">${renderHeader()}${renderTaskEditor()}${renderTaskList()}</div>`;
}

function renderHeader(): string {
  const totalSteps = state.tasks.reduce(
    (total, task) => total + task.steps.length,
    0,
  );
  return `<header class="hero"><p class="eyebrow">Focus workspace</p><h1>One step<br>at a time.</h1><p class="intro">Turn an overwhelming task into a small next action.</p><p class="summary">${state.tasks.length} task${state.tasks.length === 1 ? "" : "s"} · ${totalSteps} step${totalSteps === 1 ? "" : "s"}</p></header>`;
}

function renderTaskEditor(): string {
  const task = state.tasks.find((item) => item.id === state.editingTaskId);
  const buttonText = task === undefined ? "Add task" : "Save task";
  return `<section class="editor"><div><p class="eyebrow">${task === undefined ? "Start here" : "Edit task"}</p><h2>${task === undefined ? "What needs your attention?" : "Make the task clear."}</h2></div><form data-form="task" class="task-form"><label>Task<input name="title" maxlength="100" required value="${escapeHtml(task?.title ?? "")}" placeholder="e.g. Build the billing feature"></label><label>Context <span>(optional)</span><textarea name="note" rows="2" maxlength="240" placeholder="What matters for this task?">${escapeHtml(task?.note ?? "")}</textarea></label><div class="form-actions">${task === undefined ? "" : '<button class="secondary-button" type="button" data-action="cancel-edit">Cancel</button>'}<button class="primary-button" type="submit">${buttonText}</button></div></form></section>`;
}

function renderTaskList(): string {
  if (state.tasks.length === 0)
    return `<section class="empty-state"><div class="spark">✦</div><h2>Make the first move.</h2><p>Create a task, then add only the next few steps.</p></section>`;
  return `<section class="task-list" aria-live="polite">${state.tasks.map(renderTaskCard).join("")}</section>`;
}

function renderTaskCard(task: FocusTask): string {
  const progress = taskProgress(task);
  const active = getActiveTask()?.id === task.id;
  return `<article class="task-card ${isCompleted(task) ? "completed" : ""}"><div class="task-heading"><div><p class="task-status">${isCompleted(task) ? "Completed" : `${progress.completed} of ${progress.total} complete`}</p><h2>${escapeHtml(task.title)}</h2>${task.note ? `<p class="task-note">${escapeHtml(task.note)}</p>` : ""}</div><div class="task-actions"><button class="text-button" data-action="edit-task" data-task-id="${task.id}">Edit</button><button class="text-button danger" data-action="remove-task" data-task-id="${task.id}">Remove</button></div></div><div class="progress-track" aria-label="${progress.percent}% complete"><span style="width:${progress.percent}%"></span></div>${renderSteps(task)}${active ? renderSuggestionPanel(task) : ""}<form class="step-form" data-form="step" data-task-id="${task.id}"><input name="step" maxlength="120" required placeholder="Add a step manually"><button aria-label="Add step" class="add-button" type="submit">+</button></form></article>`;
}

function renderSteps(task: FocusTask): string {
  if (task.steps.length === 0)
    return `<p class="no-steps">No steps yet. Start with one small action.</p>`;
  return `<ul class="steps">${task.steps.map((step) => `<li><button class="checkbox ${step.completed ? "checked" : ""}" data-action="toggle-step" data-task-id="${task.id}" data-step-id="${step.id}" aria-label="${step.completed ? "Mark incomplete" : "Mark complete"}">${step.completed ? "✓" : ""}</button><span>${escapeHtml(step.text)}</span></li>`).join("")}</ul>`;
}

function renderSuggestionPanel(task: FocusTask): string {
  const unavailable = suggestionProvider === null;
  const suggestionFields = state.suggestedSteps
    .map(
      (step) =>
        `<input name="suggestion" maxlength="120" value="${escapeHtml(step)}">`,
    )
    .join("");
  const draft = suggestionFields
    ? `<form class="suggestion-draft" data-form="suggestions" data-task-id="${task.id}"><p>Review and edit before adding.</p>${suggestionFields}<div><button class="secondary-button" type="button" data-action="discard-suggestions">Discard</button><button class="primary-button" type="submit">Add suggestions</button></div></form>`
    : "";
  return `<section class="suggestions"><div class="suggestion-heading"><div><p class="eyebrow">Local AI</p><h3>Need a starting point?</h3></div><button class="secondary-button" data-action="suggest-steps" ${unavailable ? "disabled" : ""}>Suggest steps</button></div>${state.statusMessage ? `<p class="status-message">${escapeHtml(state.statusMessage)}</p>` : ""}${draft}</section>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
