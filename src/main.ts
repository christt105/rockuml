import { ViewPlugin } from "@codemirror/view";
import { Plugin } from "obsidian";
import type { Diagram } from "./diagram";
import { LiveMermaid } from "./live-mermaid";
import { MermaidView, mermaidViewType } from "./mermaid-view";
import { ReadingMermaid } from "./reading-mermaid";

export default class RockUmlPlugin extends Plugin {
	override onload(): void {
		const sources = new WeakMap<Node, string>();
		const sections = new Map<HTMLElement, ReadingMermaid>();
		const open = async (diagram: Diagram) => {
			const leaf = this.app.workspace.getLeaf("tab");
			await leaf.setViewState({ type: mermaidViewType, state: { diagram }, active: true });
			await this.app.workspace.revealLeaf(leaf);
		};

		this.registerView(mermaidViewType, leaf => new MermaidView(leaf));
		this.registerEditorExtension(ViewPlugin.define(editor => new LiveMermaid(editor, open)));
		this.registerMarkdownPostProcessor((element, context) => {
			if (!sections.has(element) && ReadingMermaid.hasDiagram(element)) {
				const reading = new ReadingMermaid(element, context, this.app, sources, open);
				sections.set(element, reading);
				reading.register(() => sections.delete(element));
				context.addChild(reading);
			}
		}, -1);
		this.register(() => {
			for (const section of sections.values()) {
				section.unload();
			}
		});
	}
}
