import { expect, it } from "vitest";
import { loadSettings } from "./rockuml-settings";

it.each([undefined, null, false, {}, { exportTheme: "sepia", exportBackground: "gradient" }])("defaults missing or invalid settings from %j", data => {
	expect(loadSettings(data)).toEqual({ plantUmlServerUrl: "", exportTheme: "note", exportBackground: "solid" });
});

it.each([
	{ plantUmlServerUrl: "https://example.test/plantuml", exportTheme: "light", exportBackground: "transparent" },
	{ plantUmlServerUrl: "", exportTheme: "dark", exportBackground: "solid" },
])("keeps valid settings from %j", data => {
	expect(loadSettings(data)).toEqual(data);
});

it("defaults individual missing settings independently", () => {
	expect(loadSettings({ exportBackground: "transparent" })).toEqual({ plantUmlServerUrl: "", exportTheme: "note", exportBackground: "transparent" });
});


it("normalizes PlantUML settings and defaults invalid values to an empty URL", () => {
	expect(loadSettings({ plantUmlServerUrl: "  http://localhost:8080  " }).plantUmlServerUrl).toBe("http://localhost:8080");
	expect(loadSettings({ plantUmlServerUrl: 8080 }).plantUmlServerUrl).toBe("");
});
