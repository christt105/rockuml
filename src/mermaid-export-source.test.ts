import { expect, it } from "vitest";
import { mermaidExportSource } from "./mermaid-export-source";

const source = '---\nconfig:\n  theme: forest\n  htmlLabels: true\n---\n%%{init: {"theme": "dark", "htmlLabels": true}}%%\nflowchart LR\nA["a<br/>b"] --> B';

it("keeps note-themed SVG source intact", () => {
	expect(mermaidExportSource(source, "note", "svg")).toBe(source);
});

it.each([
	["light", "default"],
	["dark", "dark"],
] as const)("appends the %s SVG theme after the diagram's settings and preserves its labels", (theme, mermaidTheme) => {
	expect(mermaidExportSource(source, theme, "svg")).toBe(source + `\n%%{init: {"theme":"${mermaidTheme}"}}%%\n`);
});

it("overrides only HTML labels for note-themed PNG exports", () => {
	expect(mermaidExportSource(source, "note", "png")).toBe(source + '\n%%{init: {"htmlLabels":false}}%%\n');
});

it.each([
	["light", "default"],
	["dark", "dark"],
] as const)("appends both the %s theme and the PNG label override", (theme, mermaidTheme) => {
	expect(mermaidExportSource(source, theme, "png")).toBe(source + `\n%%{init: {"theme":"${mermaidTheme}","htmlLabels":false}}%%\n`);
});
