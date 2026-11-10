# Foco project guidance

This repository is a small browser application for breaking a task into short, checkable steps.

## Product decisions

- Use HTML, CSS, and TypeScript without a UI framework. Vite is build tooling only.
- Generate suggested steps with the browser's local Prompt API. Keep the API behind a project-owned interface so availability and responses can be tested.
- Let the user review and edit suggestions before adding them to a task.
- Keep tasks in memory only. Reloading or closing the page clears them; do not add persistence without an explicit product decision.
- Show each step's completion and task progress. Let the user remove a completed task explicitly.
- Do not use XP, points, or paid API calls.

## Code

- Keep functions small and single-purpose (about 4–20 lines) and files under 500 lines. Split by responsibility.
- Use specific, greppable names. Avoid generic names such as `data`, `handler`, `Manager`, and `utils`.
- Use explicit TypeScript types. Do not use `any`, untyped functions, or type escape hatches.
- Extract shared logic rather than duplicating it.
- Prefer early returns and no more than two levels of nesting.
- Inject dependencies through parameters or constructors; wrap browser and third-party APIs behind thin project-owned interfaces.
- Preserve existing comments during refactors. Explain why a non-obvious choice exists, not what the code plainly does.
- Document public functions with intent and one usage example. Cite an issue or commit when a workaround exists for a specific bug or upstream limitation.
- Include the offending value and expected shape in errors unless the value is sensitive.
- Follow the owning module and the project's established paths when changing behavior.

## Tests and validation

- Use TDD: write a failing behavior test, confirm the failure, implement the smallest fix, then refactor.
- Test every new or changed behavior; add a regression test for each bug fix.
- Assert observable behavior, not implementation details. Keep tests fast, independent, and deterministic.
- Never delete, skip, or weaken a test solely to make a change pass. If a test appears wrong, ask before changing it.
- Use named fake classes for external I/O, including the browser AI API; do not use inline stubs.
- Once the TypeScript project is set up, document `npm test` in README.md as the single test command.
- Run the configured formatter, linter, type check, relevant tests, and build. Report any check not run.
- Use structured logs for diagnostics without sensitive data; use plain text for user-facing CLI output.
- Update README.md when public behavior or the development workflow changes.

## Working together

- Use a specialized subagent for substantial independent frontend, backend, discovery, or planning work when it improves the result. Keep small tasks inline.
