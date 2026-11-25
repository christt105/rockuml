import { loadMermaid, MarkdownView, Notice, Plugin } from "obsidian";
import elkLayouts from "@mermaid-js/layout-elk";
import { ElkPreviewModal } from "./ElkPreviewModal";
import { firstMermaidBlock } from "./first-mermaid-block";

export default class RockUmlPlugin extends Plugin {
	override onload(): void {
		this.addCommand({
			id: "render-first-mermaid-block-with-elk",
			name: "Render first Mermaid block with ELK (spike)",
			checkCallback: (checking) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view || !view.file) return false;
				if (!checking) void this.renderElkPreview(view.editor.getValue());
				return true;
			},
		});
	}

	private async renderElkPreview(markdown: string): Promise<void> {
		const source = firstMermaidBlock(markdown);
		if (source === undefined) {
			new Notice("No Mermaid block found in the active note.");
			return;
		}

		try {
			const mermaid = await loadMermaid() as typeof import("mermaid").default;
			if (typeof mermaid.registerLayoutLoaders !== "function") {
				new Notice("This version of Obsidian's Mermaid cannot register ELK layouts.");
				return;
			}

			mermaid.registerLayoutLoaders(elkLayouts);
			const id = `rockuml-elk-${crypto.getRandomValues(new Uint32Array(2)).join("-")}`;
			const { svg } = await mermaid.render(id, source + '\n%%{init: {"layout":"elk"}}%%');
			new ElkPreviewModal(this.app, svg).open();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Mermaid ELK preview failed: ${message}`);
		}
	}
}
