import { describe, expect, it } from "vitest";

import {
  addStep,
  createTask,
  isCompleted,
  removeTask,
  replaceTask,
  taskProgress,
  toggleStep,
  updateTask,
} from "../src/tasks";

describe("task operations", () => {
  it("creates an incomplete task without steps", () => {
    const task = createTask(
      "Plan the release",
      "Keep it small",
      () => "task-1",
    );

    expect(task).toEqual({
      id: "task-1",
      title: "Plan the release",
      note: "Keep it small",
      steps: [],
    });
  });

  it("calculates progress after completing a step", () => {
    const task = addStep(
      addStep(
        createTask("Ship", "", () => "task-1"),
        "Write tests",
        () => "step-1",
      ),
      "Run checks",
      () => "step-2",
    );
    const completedTask = toggleStep(task, "step-1");

    expect(taskProgress(completedTask)).toEqual({
      completed: 1,
      total: 2,
      percent: 50,
    });
  });

  it("removes a task by identifier", () => {
    const task = createTask("Ship", "", () => "task-1");

    expect(removeTask([task], "task-1")).toEqual([]);
  });

  it("updates the task details without changing its steps", () => {
    const original = addStep(
      createTask("Draft", "", () => "task-1"),
      "Outline",
      () => "step-1",
    );

    expect(updateTask(original, "Write", "Use plain English")).toEqual({
      ...original,
      title: "Write",
      note: "Use plain English",
    });
  });

  it("replaces a task and reports when all of its steps are complete", () => {
    const task = addStep(
      createTask("Release", "", () => "task-1"),
      "Deploy",
      () => "step-1",
    );
    const completed = toggleStep(task, "step-1");

    expect(replaceTask([task], completed)).toEqual([completed]);
    expect(isCompleted(completed)).toBe(true);
  });
});
