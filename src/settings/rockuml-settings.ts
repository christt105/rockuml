export type ExportTheme = "note" | "light" | "dark";

export interface RockUmlSettings {
	exportTheme: ExportTheme;
	exportBackground: "transparent" | "solid";
}

export function loadSettings(data: unknown): RockUmlSettings {
	const saved = data as Partial<RockUmlSettings> | null | undefined;
	const theme = saved?.exportTheme;
	return {
		exportTheme: theme === "light" || theme === "dark" ? theme : "note",
		exportBackground: saved?.exportBackground === "transparent" ? "transparent" : "solid",
	};
}
