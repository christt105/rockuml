import { expect, it } from "vitest";
import { boundedScale, fitDiagram, pan, zoomAt } from "./pan-zoom";

it("keeps the diagram point below the cursor fixed when zooming", () => {
	const transform = { x: 10, y: -10, scale: 0.5 };
	const cursor = { x: 160, y: 80 };
	const zoomed = zoomAt(transform, cursor, 2);
	expect(zoomed).toEqual({ x: -440, y: -280, scale: 2 });
	expect(zoomAt(zoomed, cursor, transform.scale)).toEqual(transform);
});

it("pans in viewport pixels regardless of zoom", () => {
	expect(pan({ x: 10, y: 20, scale: 4 }, { x: 25, y: -30 }))
		.toEqual({ x: 35, y: -10, scale: 4 });
});

it("fits and centers a wide diagram with padding", () => {
	const fit = fitDiagram({ width: 848, height: 600 }, { width: 8000, height: 2300 });
	expect(fit).toEqual({ x: 24, y: 185, scale: 0.1 });
});

it("centers small diagrams at actual size", () => {
	expect(fitDiagram({ width: 400, height: 300 }, { width: 100, height: 50 }))
		.toEqual({ x: 150, y: 125, scale: 1 });
});

it("lets a very large diagram zoom out to its fit scale", () => {
	expect(boundedScale(0.001, 0.025)).toBe(0.025);
	expect(boundedScale(0.001, 0.4)).toBe(0.05);
	expect(boundedScale(30, 0.4)).toBe(16);
});
