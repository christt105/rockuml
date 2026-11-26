import { type EditorView } from "@codemirror/view";
import { editorInfoField } from "obsidian";
import type { Diagram } from "./diagram";
import { diagramToolbar } from "./diagram-toolbar";
import { mermaidBlocks } from "./mermaid-blocks";
import type { RockUmlSettings } from "./settings/rockuml-settings";

export class LiveMermaid {
	private readonly toolbars = new Map<HTMLElement, HTMLElement>();
	private readonly observer = new MutationObserver(() => this.refresh());

	constructor(
		private readonly editor: EditorView,
		private readonly open: (diagram: Diagram) => Promise<void>,
		private readonly getSettings: () => RockUmlSettings,
	) {
		this.observer.observe(editor.contentDOM, { childList: true, subtree: true });
		this.refresh();
	}

	destroy(): void {
		this.observer.disconnect();
		for (const toolbar of this.toolbars.values()) {
			toolbar.remove();
		}
		this.toolbars.clear();
	}

	private refresh(): void {
		for (const [element, toolbar] of this.toolbars) {
			if (!this.editor.contentDOM.contains(element)) {
				toolbar.remove();
				this.toolbars.delete(element);
			}
		}
		for (const widget of Array.from(this.editor.contentDOM.querySelectorAll<HTMLElement>(".cm-embed-block.cm-lang-mermaid"))) {
			const element = widget.querySelector<HTMLElement>(":scope > .mermaid");
			if (element?.querySelector(":scope > svg") && !this.toolbars.has(element)) {
				const toolbar = diagramToolbar(element, () => this.getDiagram(widget), this.open, this.getSettings);
				this.toolbars.set(element, toolbar);
			}
		}
	}

	private getDiagram(widget: HTMLElement): Diagram {
		const { state } = this.editor;
		const file = state.field(editorInfoField, false)?.file;
		const line = state.doc.lineAt(this.editor.posAtDOM(widget)).number - 1;
		const block = mermaidBlocks(state.doc.toString()).find(block => line >= block.start && line <= block.end);
		if (!block) {
			throw new Error("The Mermaid source could not be found in this editor.");
		}
		return { source: block.source, number: block.number, noteName: file?.basename ?? "diagram" };
	}
}
