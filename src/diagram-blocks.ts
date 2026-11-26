import type { DiagramLanguage } from "./diagram";

export function diagramBlocks(markdown: string, language: DiagramLanguage) {
	const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
	const blocks: { source: string; start: number; end: number; number: number }[] = [];
	const frontmatterEnd = lines[0] === "---"
		? lines.findIndex((line, index) => index > 0 && /^(---|\.\.\.)\s*$/.test(line))
		: -1;
	let fence: { marker: string; indent: number; language: string; start: number } | undefined;
	let body: string[] = [];
	let number = 0;

	for (let index = frontmatterEnd + 1; index < lines.length; index++) {
		const line = lines[index].replace(/^(?:[ \t]*>[ \t]?)+/, "");
		if (!fence) {
			const opening = /^(\s*)(?:[-+*][ \t]+|\d+[.)][ \t]+)?(`{3,}|~{3,})[ \t]*(.*)$/.exec(line);
			if (opening && (opening[2][0] === "~" || !opening[3].includes("`"))) {
				fence = {
					marker: opening[2],
					indent: opening[1].length,
					language: opening[3].trim(),
					start: index,
				};
				body = [];
			}
		} else {
			const closing = /^\s*(`{3,}|~{3,})\s*$/.exec(line);
			if (closing && closing[1].startsWith(fence.marker)) {
				if (fence.language === "mermaid" || fence.language === "plantuml") {
					number++;
				}
				if (fence.language === language) {
					blocks.push({ source: body.join("\n"), start: fence.start, end: index, number });
				}
				fence = undefined;
			} else if (fence.language === language) {
				const indent = line.match(/^\s*/)?.[0].length ?? 0;
				body.push(line.slice(Math.min(indent, fence.indent)));
			}
		}
	}
	return blocks;
}
