import { expect, it } from "vitest";
import { diagramBlocks } from "./diagram-blocks";

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

	expect(diagramBlocks(note, "mermaid")).toEqual([
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

	expect(diagramBlocks(note, "mermaid")).toEqual([
		{ start: 8, end: 10, number: 1, source: "flowchart LR" },
	]);
});


it("numbers Mermaid and PlantUML together and skips other languages", () => {
	const note = ["```plantuml", "Alice -> Bob", "```", "```text", "skip", "```", "```mermaid", "flowchart LR", "```"].join("\n");
	expect(diagramBlocks(note, "plantuml")).toEqual([{ start: 0, end: 2, number: 1, source: "Alice -> Bob" }]);
	expect(diagramBlocks(note, "mermaid")).toEqual([{ start: 6, end: 8, number: 2, source: "flowchart LR" }]);
});
