import { expect, it } from "vitest";
import { mermaidBlocks } from "./mermaid-blocks";

it("locates Mermaid fences in the source note and leaves block IDs out of the source", () => {
	const note = [
		"# System",
		"```mermaid",
		"flowchart LR",
		"  A --> B",
		"```",
		"",
		"^system",
		"",
		"> ~~~~mermaid",
		"> sequenceDiagram",
		">   A->>B: Hello",
		"> ~~~~",
	].join("\r\n");

	expect(mermaidBlocks(note)).toEqual([
		{ start: 1, end: 4, number: 1, source: "flowchart LR\n  A --> B" },
		{ start: 8, end: 11, number: 2, source: "sequenceDiagram\n  A->>B: Hello" },
	]);
});

it("skips frontmatter and other fenced examples when numbering diagrams", () => {
	const note = [
		"---",
		"tags: [mermaid]",
		"---",
		"````markdown",
		"```mermaid",
		"flowchart TB",
		"```",
		"````",
		"```mermaid",
		"flowchart LR",
		"```",
	].join("\n");

	expect(mermaidBlocks(note)).toEqual([
		{ start: 8, end: 10, number: 1, source: "flowchart LR" },
	]);
});
