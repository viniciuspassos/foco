export interface FocusStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface FocusTask {
  id: string;
  title: string;
  note: string;
  steps: FocusStep[];
}

export interface TaskProgress {
  completed: number;
  total: number;
  percent: number;
}

export type IdentifierFactory = () => string;

export function createTask(
  title: string,
  note: string,
  createIdentifier: IdentifierFactory,
): FocusTask {
  return { id: createIdentifier(), title, note, steps: [] };
}

export function updateTask(
  task: FocusTask,
  title: string,
  note: string,
): FocusTask {
  return { ...task, title, note };
}

export function addStep(
  task: FocusTask,
  text: string,
  createIdentifier: IdentifierFactory,
): FocusTask {
  const step = { id: createIdentifier(), text, completed: false };
  return { ...task, steps: [...task.steps, step] };
}

export function toggleStep(task: FocusTask, stepId: string): FocusTask {
  const steps = task.steps.map((step) =>
    step.id === stepId ? { ...step, completed: !step.completed } : step,
  );
  return { ...task, steps };
}

export function removeTask(tasks: FocusTask[], taskId: string): FocusTask[] {
  return tasks.filter((task) => task.id !== taskId);
}

export function replaceTask(
  tasks: FocusTask[],
  updatedTask: FocusTask,
): FocusTask[] {
  return tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
}

export function taskProgress(task: FocusTask): TaskProgress {
  const completed = task.steps.filter((step) => step.completed).length;
  const total = task.steps.length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function isCompleted(task: FocusTask): boolean {
  return task.steps.length > 0 && task.steps.every((step) => step.completed);
}
