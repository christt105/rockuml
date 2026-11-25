import { App, Modal, sanitizeHTMLToDom } from "obsidian";

export class ElkPreviewModal extends Modal {
	constructor(app: App, private readonly svg: string) {
		super(app);
	}

	override onOpen(): void {
		this.setTitle("Mermaid ELK preview");
		this.modalEl.addClass("rockuml-elk-preview");
		this.contentEl.append(sanitizeHTMLToDom(this.svg));
	}

	override onClose(): void {
		this.contentEl.empty();
	}
}
