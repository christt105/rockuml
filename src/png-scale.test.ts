import { expect, it } from "vitest";
import { pngScales, pngSize } from "./png-scale";

it.each(pngScales)("scales fractional SVG dimensions at %sx without clipping", scale => {
	expect(pngSize({ width: 20.1, height: 10.25 }, scale)).toEqual({
		width: 20 * scale + 1,
		height: 10 * scale + Math.ceil(scale / 4),
	});
});
