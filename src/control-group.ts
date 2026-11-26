export function createControlGroup(parent: HTMLElement, cls: string, label: string): HTMLElement {
	const id = `rockuml-group-${crypto.randomUUID()}`;
	const group = parent.createDiv({ cls, attr: { role: "group", "aria-labelledby": id } });
	group.createSpan({ text: label, attr: { id, hidden: "" } });
	return group;
}
