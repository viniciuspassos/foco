type DraftField = HTMLInputElement | HTMLTextAreaElement;

/** Redraw a workspace while keeping unsaved text and the active text selection. */
export function redrawWithFormDrafts(
  container: HTMLElement,
  markup: string,
): void {
  const fields = indexDraftFields(container);
  const focused = container.ownerDocument.activeElement;
  container.innerHTML = markup;
  for (const [key, field] of indexDraftFields(container)) {
    const previous = fields.get(key);
    if (previous === undefined) continue;
    field.value = previous.value;
    if (previous === focused) restoreDraftFocus(field, previous);
  }
}

function indexDraftFields(container: HTMLElement): Map<string, DraftField> {
  const fields = new Map<string, DraftField>();
  for (const form of container.querySelectorAll<HTMLFormElement>(
    "form[data-form]",
  )) {
    const formKey = `${form.dataset.form}:${form.dataset.taskId ?? ""}`;
    form
      .querySelectorAll<DraftField>("input[name], textarea[name]")
      .forEach((field, index) => {
        fields.set(`${formKey}:${field.name}:${index}`, field);
      });
  }
  return fields;
}

function restoreDraftFocus(field: DraftField, previous: DraftField): void {
  field.focus({ preventScroll: true });
  if (previous.selectionStart !== null && previous.selectionEnd !== null) {
    field.setSelectionRange(
      previous.selectionStart,
      previous.selectionEnd,
      previous.selectionDirection ?? undefined,
    );
  }
}
