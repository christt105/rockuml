import type { Diagram } from "./diagram";

export function diagramFromState(state: unknown): Diagram | undefined {
	if (!state || typeof state !== "object" || !("diagram" in state)) {
		return;
	}
	const diagram = state.diagram;
	if (!diagram || typeof diagram !== "object" || !("source" in diagram) || !("noteName" in diagram) || !("number" in diagram)) {
		return;
	}
	const { source, noteName, number } = diagram;
	if (typeof source === "string" && typeof noteName === "string" &&
		typeof number === "number" && Number.isSafeInteger(number) && number >= 1) {
		return { source, noteName, number };
	}
}
