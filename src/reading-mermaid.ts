import { type App, MarkdownRenderChild, type MarkdownPostProcessorContext, parseLinktext, resolveSubpath } from "obsidian";
import type { Diagram } from "./diagram";
import { diagramToolbar } from "./diagram-toolbar";
import { mermaidBlocks } from "./mermaid-blocks";

const renderedSelector = ".mermaid";
const sourceSelector = "pre > code.language-mermaid";

export class ReadingMermaid extends MarkdownRenderChild {
	private readonly toolbars = new Map<HTMLElement, HTMLElement>();
	private readonly observer = new MutationObserver(records => {
		for (const record of records) {
			const removed = Array.from(record.removedNodes);
			const added = Array.from(record.addedNodes);
			if (removed.length !== 1 || added.length !== 1) {
				continue;
			}
			const source = this.sources.get(removed[0]);
			if (source !== undefined) {
				this.sources.set(added[0], source);
			}
		}
		this.refresh();
	});

	constructor(
		element: HTMLElement,
		private readonly context: MarkdownPostProcessorContext,
		private readonly app: App,
		private readonly sources: WeakMap<Node, string>,
		private readonly open: (diagram: Diagram) => Promise<void>,
	) {
		super(element);
	}

	static hasDiagram(element: HTMLElement): boolean {
		return !!element.querySelector(`${sourceSelector}, ${renderedSelector} > svg`);
	}

	override onload(): void {
		for (const code of Array.from(this.containerEl.querySelectorAll<HTMLElement>(sourceSelector))) {
			const pre = code.parentElement;
			if (pre && !code.closest(".mermaid-wrapper")) {
				this.sources.set(pre, (code.textContent ?? "").replace(/\n$/, ""));
			}
		}
		this.observer.observe(this.containerEl, { childList: true, subtree: true });
		this.refresh();
	}

	override onunload(): void {
		this.observer.disconnect();
		for (const toolbar of this.toolbars.values()) {
			toolbar.remove();
		}
		this.toolbars.clear();
	}

	private refresh(): void {
		const embed = this.containerEl.closest(".markdown-embed");
		const diagrams = Array.from(this.containerEl.querySelectorAll<HTMLElement>(renderedSelector))
			.filter(element => element.closest(".markdown-embed") === embed && element.querySelector(":scope > svg"));
		for (const [element, toolbar] of this.toolbars) {
			if (!this.containerEl.contains(element)) {
				toolbar.remove();
				this.toolbars.delete(element);
			}
		}
		for (const element of diagrams) {
			if (!this.toolbars.has(element)) {
				this.toolbars.set(element, diagramToolbar(element, () => this.getDiagram(element), this.open));
			}
		}
	}

	private async getDiagram(element: HTMLElement): Promise<Diagram> {
		const path = this.context.sourcePath;
		const file = this.app.vault.getFileByPath(path);
		const noteName = file?.basename ?? (path.split("/").pop()?.replace(/\.md$/i, "") || "diagram");
		const source = this.sources.get(element);
		const section = this.context.getSectionInfo(element);
		const blocks = section
			? mermaidBlocks(section.text)
			: file ? mermaidBlocks(await this.app.vault.cachedRead(file)) : [];
		const link = element.closest(".markdown-embed[src]")?.getAttribute("src");
		const subpath = link ? parseLinktext(link).subpath : "";
		const metadata = !section && subpath && file ? this.app.metadataCache.getFileCache(file) : null;
		const target = metadata ? resolveSubpath(metadata, subpath) : null;
		const start = section?.lineStart ?? target?.start.line ?? 0;
		const end = section?.lineEnd ?? target?.end?.line ?? Infinity;
		const candidates = blocks.filter(block => block.start >= start && block.start <= end);
		const peers = Array.from(this.containerEl.querySelectorAll<HTMLElement>(renderedSelector)).filter(peer =>
			peer.closest(".markdown-embed") === element.closest(".markdown-embed")
			&& peer.querySelector(":scope > svg")
			&& (!section || this.context.getSectionInfo(peer)?.lineStart === section.lineStart),
		);
		const sameSource = source === undefined ? candidates : candidates.filter(block => block.source.trim() === source.trim());
		const index = peers.indexOf(element);
		const atPosition = candidates[index];
		const block = sameSource.includes(atPosition) ? atPosition : sameSource[0];
		const diagramSource = source ?? block?.source;
		if (diagramSource === undefined) {
			throw new Error("The Mermaid source could not be found in this note.");
		}
		return { source: diagramSource, noteName, number: block?.number ?? 1 };
	}
}
