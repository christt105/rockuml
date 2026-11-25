import { expect, it } from "vitest";
import { svgExportFileName } from "./export-file-name";

it("names an SVG export after the note and diagram number", () => {
	expect(svgExportFileName("System design", 2)).toBe("System design-2.svg");
});
