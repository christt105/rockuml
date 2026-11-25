export function firstMermaidBlock(markdown: string): string | undefined {
	let fence: string | undefined;
	let isMermaid = false;
	const lines: string[] = [];

	for (const line of markdown.split(/\r?\n/)) {
		if (fence === undefined) {
			const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
			if (opening && (!opening[1].startsWith("`") || !opening[2].includes("`"))) {
				fence = opening[1];
				isMermaid = fence.startsWith("`") && opening[2].trim() === "mermaid";
			}
			continue;
		}

		const closing = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
		if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) {
			if (isMermaid) return lines.join("\n");
			fence = undefined;
		} else if (isMermaid) {
			lines.push(line);
		}
	}

	return undefined;
}
