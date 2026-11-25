import { expect, it } from "vitest";
import { firstMermaidBlock } from "./first-mermaid-block";

it("returns undefined if the note has no Mermaid block", () => {
	expect(firstMermaidBlock("Text with `mermaid` inline\n```js\nconst diagram = 0;\n```")).toBeUndefined();
});

it("returns the first Mermaid block when the note has several", () => {
	const note = ["# Diagrams", "```mermaid", "flowchart TD", "A --> B", "```", "```mermaid", "C --> D", "```"].join("\n");
	expect(firstMermaidBlock(note)).toBe("flowchart TD\nA --> B");
});

it("ignores Mermaid examples inside other fenced code blocks", () => {
	const note = ["````markdown", "```mermaid", "A --> B", "```", "````", "```mermaid", "C --> D", "```"].join("\n");
	expect(firstMermaidBlock(note)).toBe("C --> D");
});

it("accepts longer fences and CRLF line endings", () => {
	const note = ["  ````mermaid ", "flowchart TD", "A --> B", "  `````"].join("\r\n");
	expect(firstMermaidBlock(note)).toBe("flowchart TD\nA --> B");
});

it("ignores an unfinished Mermaid block", () => {
	expect(firstMermaidBlock("```mermaid\nflowchart TD")).toBeUndefined();
});
