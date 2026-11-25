import { expect, it } from "vitest";
import { pngSource } from "./png-source";

it("adds the PNG label override after existing frontmatter and init directives", () => {
	const source = '---\nconfig:\n  htmlLabels: true\n---\n%%{init: {"htmlLabels": true}}%%\nflowchart LR\nA["a<br/>b"] --> B';
	expect(pngSource(source)).toBe(source + '\n%%{init: {"htmlLabels": false}}%%\n');
});
