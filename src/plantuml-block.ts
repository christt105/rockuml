import { EditorView } from "@codemirror/view";
import { type App, editorInfoField, MarkdownRenderChild, type MarkdownPostProcessorContext } from "obsidian";
import type { Diagram } from "./diagram";
import { diagramBlocks } from "./diagram-blocks";
import { diagramNote } from "./diagram-note";
import { diagramToolbar } from "./diagram-toolbar";
import type { PlantUmlRenderer } from "./plantuml-renderer";
import type { RockUmlSettings } from "./settings/rockuml-settings";
import { svgSize } from "./svg-size";

export class PlantUmlBlock extends MarkdownRenderChild {
	private active = false;

	constructor(
		element: HTMLElement,
		private readonly context: MarkdownPostProcessorContext,
		private readonly app: App,
		private readonly source: string,
		private readonly renderer: PlantUmlRenderer,
		private readonly open: (diagram: Diagram) => Promise<void>,
		private readonly getSettings: () => RockUmlSettings,
	) {
		super(element);
	}

	override onload(): void {
		this.active = true;
		void this.render();
	}

	override onunload(): void {
		this.active = false;
		this.containerEl.replaceChildren();
	}

	private async render(): Promise<void> {
		const element = this.containerEl;
		element.addClass("rockuml-plantuml");
		const status = element.createDiv({ text: "Rendering PlantUML…", attr: { role: "status" } });
		try {
			const { svg, syntaxError } = await this.renderer.render(this.source, this.getSettings().plantUmlServerUrl, element.ownerDocument);
			if (!this.active || status.parentElement !== element) {
				return;
			}
			svgSize(svg);
			element.append(svg);
			if (syntaxError) {
				status.setText("The diagram contains a syntax error.");
			} else {
				status.remove();
				diagramToolbar(element, () => this.getDiagram(), this.open, this.getSettings, "plantuml");
			}
		} catch (error) {
			status.setText(error instanceof Error ? error.message : "PlantUML could not render this diagram.");
		}
	}

	private async getDiagram(): Promise<Diagram> {
		const element = this.containerEl;
		const { file, noteName, section, start, end } = diagramNote(this.app, this.context, element);
		const widget = element.closest<HTMLElement>(".cm-embed-block.cm-lang-plantuml");
		const editorRoot = widget?.closest<HTMLElement>(".cm-editor");
		const editor = editorRoot && EditorView.findFromDOM(editorRoot);
		if (widget && editor && editor.state.field(editorInfoField, false)?.file?.path === this.context.sourcePath) {
			const line = editor.state.doc.lineAt(editor.posAtDOM(widget)).number - 1;
			const block = diagramBlocks(editor.state.doc.toString(), "plantuml").find(block => line >= block.start && line <= block.end);
			if (block) {
				return { language: "plantuml", source: this.source, noteName, number: block.number };
			}
		}
		const markdown = section?.text ?? (file ? await this.app.vault.cachedRead(file) : "");
		const blocks = diagramBlocks(markdown, "plantuml");
		const sectionBlocks = blocks.filter(block => block.start >= start && block.start <= end);
		const sameSource = (block: { source: string }) => block.source.trim() === this.source.trim();
		const block = sectionBlocks.find(sameSource) ?? blocks.find(sameSource) ?? sectionBlocks[0];
		return { language: "plantuml", source: this.source, noteName, number: block?.number ?? 1 };
	}
}
