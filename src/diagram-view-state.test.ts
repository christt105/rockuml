import { expect, it } from "vitest";
import { diagramFromState } from "./diagram-view-state";

const diagram = { source: "flowchart LR\nA --> B", noteName: "Architecture", number: 2 };

it("restores a diagram from serialized workspace state", () => {
	const state: unknown = JSON.parse(JSON.stringify({ diagram }));
	expect(diagramFromState(state)).toEqual(diagram);
});

it("ignores legacy tabs without a saved diagram", () => {
	expect(diagramFromState(undefined)).toBeUndefined();
	expect(diagramFromState({})).toBeUndefined();
});

it.each([null, {}, { ...diagram, source: 42 }, { ...diagram, noteName: null },
	{ ...diagram, number: "2" }, { ...diagram, number: 0 },
	{ ...diagram, number: 1.5 }, { ...diagram, number: Infinity }])(
	"ignores an invalid diagram (%j)",
	saved => expect(diagramFromState({ diagram: saved })).toBeUndefined(),
);
