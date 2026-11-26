import type { Point } from "./point";
import type { Size } from "./size";
import type { Transform } from "./transform";

export function pan(transform: Transform, delta: Point): Transform {
	return { x: transform.x + delta.x, y: transform.y + delta.y, scale: transform.scale };
}

export function zoomAt(transform: Transform, point: Point, scale: number): Transform {
	const ratio = scale / transform.scale;
	return {
		x: point.x - (point.x - transform.x) * ratio,
		y: point.y - (point.y - transform.y) * ratio,
		scale,
	};
}

export function fitDiagram(viewport: Size, diagram: Size, padding = 24): Transform {
	const scale = Math.min(
		1,
		Math.max(1, viewport.width - 2 * padding) / diagram.width,
		Math.max(1, viewport.height - 2 * padding) / diagram.height,
	);
	return {
		x: (viewport.width - diagram.width * scale) / 2,
		y: (viewport.height - diagram.height * scale) / 2,
		scale,
	};
}

export function boundedScale(scale: number, fitScale: number): number {
	return Math.min(16, Math.max(Math.min(0.05, fitScale), scale));
}
