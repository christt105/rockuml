import type { Size } from "./size";

export const pngScales = [2, 4, 8] as const;
export type PngScale = typeof pngScales[number];

export function pngSize(diagram: Size, scale: PngScale): Size {
	return {
		width: Math.ceil(diagram.width * scale),
		height: Math.ceil(diagram.height * scale),
	};
}
