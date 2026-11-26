import { expect, it } from "vitest";
import { exportBackgroundColor } from "./export-background";

it.each(["note", "light", "dark"] as const)("omits the background when the %s export is transparent", exportTheme => {
	expect(exportBackgroundColor({ exportTheme, exportBackground: "transparent" }, "#202020")).toBeUndefined();
});

it.each([
	["note", "#202020"],
	["light", "#ffffff"],
	["dark", "#333333"],
] as const)("uses the %s theme color for a solid background", (exportTheme, color) => {
	expect(exportBackgroundColor({ exportTheme, exportBackground: "solid" }, "#202020")).toBe(color);
});
