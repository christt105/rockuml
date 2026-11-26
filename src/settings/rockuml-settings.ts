export type ExportTheme = "note" | "light" | "dark";

export interface RockUmlSettings {
	exportTheme: ExportTheme;
	plantUmlServerUrl: string;
	exportBackground: "transparent" | "solid";
}

export function loadSettings(data: unknown): RockUmlSettings {
	const saved = data as Partial<RockUmlSettings> | null | undefined;
	const theme = saved?.exportTheme;
	return {
		plantUmlServerUrl: typeof saved?.plantUmlServerUrl === "string" ? saved.plantUmlServerUrl.trim() : "",
		exportTheme: theme === "light" || theme === "dark" ? theme : "note",
		exportBackground: saved?.exportBackground === "transparent" ? "transparent" : "solid",
	};
}
