import { expect, it } from "vitest";
import { diagramFromState } from "./diagram-view-state";

const diagram = { language: "mermaid", source: "flowchart LR\nA --> B", noteName: "Architecture", number: 2 };

it.each([diagram, { ...diagram, language: "plantuml", source: "Alice -> Bob" }])("restores a diagram from %j", saved => {
	const state: unknown = JSON.parse(JSON.stringify({ diagram: saved }));
	expect(diagramFromState(state)).toEqual(saved);
});

it("restores Mermaid diagrams saved before the language was recorded", () => {
	const { source, noteName, number } = diagram;
	expect(diagramFromState({ diagram: { source, noteName, number } })).toEqual(diagram);
});

it("ignores legacy tabs without a saved diagram", () => {
	expect(diagramFromState(undefined)).toBeUndefined();
	expect(diagramFromState({})).toBeUndefined();
});

it.each([null, {}, { ...diagram, language: "other" }, { ...diagram, source: 42 }, { ...diagram, noteName: null },
	{ ...diagram, number: "2" }, { ...diagram, number: 0 },
	{ ...diagram, number: 1.5 }, { ...diagram, number: Infinity }])(
	"ignores an invalid diagram (%j)",
	saved => expect(diagramFromState({ diagram: saved })).toBeUndefined(),
);
