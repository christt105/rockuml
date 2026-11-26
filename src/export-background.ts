import type { RockUmlSettings } from "./settings/rockuml-settings";

export function exportBackgroundColor(settings: RockUmlSettings, noteColor: string): string | undefined {
	if (settings.exportBackground === "transparent") {
		return undefined;
	}
	switch (settings.exportTheme) {
		case "light":
			return "#ffffff";
		case "dark":
			return "#333333";
		case "note":
			return noteColor;
	}
}
