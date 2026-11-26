import { type App, type MarkdownPostProcessorContext, parseLinktext, resolveSubpath } from "obsidian";

export function diagramNote(app: App, context: MarkdownPostProcessorContext, element: HTMLElement) {
	const path = context.sourcePath;
	const file = app.vault.getFileByPath(path);
	const noteName = file?.basename ?? (path.split("/").pop()?.replace(/\.md$/i, "") || "diagram");
	const section = context.getSectionInfo(element);
	const link = element.closest(".markdown-embed[src]")?.getAttribute("src");
	const subpath = link ? parseLinktext(link).subpath : "";
	const metadata = !section && subpath && file ? app.metadataCache.getFileCache(file) : null;
	const target = metadata ? resolveSubpath(metadata, subpath) : null;
	return {
		file,
		noteName,
		section,
		start: section?.lineStart ?? target?.start.line ?? 0,
		end: section?.lineEnd ?? target?.end?.line ?? Infinity,
	};
}
