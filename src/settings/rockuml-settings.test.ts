import { expect, it } from "vitest";
import { loadSettings } from "./rockuml-settings";

it.each([undefined, null, false, {}, { exportTheme: "sepia", exportBackground: "gradient" }])("defaults missing or invalid settings from %j", data => {
	expect(loadSettings(data)).toEqual({ exportTheme: "note", exportBackground: "solid" });
});

it.each([
	{ exportTheme: "light", exportBackground: "transparent" },
	{ exportTheme: "dark", exportBackground: "solid" },
])("keeps valid settings from %j", data => {
	expect(loadSettings(data)).toEqual(data);
});

it("defaults individual missing settings independently", () => {
	expect(loadSettings({ exportBackground: "transparent" })).toEqual({ exportTheme: "note", exportBackground: "transparent" });
});
