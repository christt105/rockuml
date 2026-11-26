import type { Size } from "./size";

export function svgSize(svg: SVGSVGElement): Size {
	const { width, height } = svg.viewBox.baseVal;
	if (width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)) {
		return { width, height };
	}
	throw new Error("The diagram has no usable SVG view box.");
}
