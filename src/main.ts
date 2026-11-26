import { ViewPlugin } from "@codemirror/view";
import { Plugin } from "obsidian";
import type { Diagram } from "./diagram";
import { LiveMermaid } from "./live-mermaid";
import { DiagramView, diagramViewType } from "./diagram-view";
import { renderMermaid } from "./mermaid-render";
import { PlantUmlBlock } from "./plantuml-block";
import { PlantUmlRenderer } from "./plantuml-renderer";
import { ReadingMermaid } from "./reading-mermaid";
import { RockUmlSettingTab } from "./settings/RockUmlSettingTab";
import { loadSettings } from "./settings/rockuml-settings";

export default class RockUmlPlugin extends Plugin {
	override settings = loadSettings(undefined);

	override async onload(): Promise<void> {
		this.settings = loadSettings(await this.loadData());
		this.addSettingTab(new RockUmlSettingTab(this.app, this));
		const getSettings = () => this.settings;
		const plantUml = new PlantUmlRenderer();
		const sources = new WeakMap<Node, string>();
		const sections = new Map<HTMLElement, ReadingMermaid>();
		const open = async (diagram: Diagram) => {
			const leaf = this.app.workspace.getLeaf("tab");
			await leaf.setViewState({ type: diagramViewType, state: { diagram }, active: true });
			await this.app.workspace.revealLeaf(leaf);
		};

		this.registerView(diagramViewType, leaf => new DiagramView(leaf, async (diagram, host) => {
			if (diagram.language === "plantuml") {
				return plantUml.render(diagram.source, getSettings().plantUmlServerUrl, host.ownerDocument);
			}
			return { svg: await renderMermaid(diagram.source, host) };
		}));
		this.registerMarkdownCodeBlockProcessor("plantuml", (source, element, context) => {
			context.addChild(new PlantUmlBlock(element, context, this.app, source, plantUml, open, getSettings));
		});
		this.registerEditorExtension(ViewPlugin.define(editor => new LiveMermaid(editor, open, getSettings)));
		this.registerMarkdownPostProcessor((element, context) => {
			if (!sections.has(element) && ReadingMermaid.hasDiagram(element)) {
				const reading = new ReadingMermaid(element, context, this.app, sources, open, getSettings);
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
