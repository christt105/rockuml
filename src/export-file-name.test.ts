import { expect, it } from "vitest";
import { pngExportFileName, svgExportFileName } from "./export-file-name";

it("names an SVG export after the note and diagram number", () => {
	expect(svgExportFileName("System design", 2)).toBe("System design-2.svg");
});

it("includes the PNG scale and replaces characters that cannot be used in a file name", () => {
	expect(pngExportFileName('System: "design"?', 3, 4)).toBe("System_ _design__-3@4x.png");
	expect(pngExportFileName("...", 1, 8)).toBe("diagram-1@8x.png");
});
