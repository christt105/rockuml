import type { ExportTheme } from "./settings/rockuml-settings";

export function mermaidExportSource(source: string, theme: ExportTheme, format: "svg" | "png"): string {
	if (theme === "note" && format === "svg") {
		return source;
	}

	const config: { theme?: "default" | "dark"; htmlLabels?: false } = {};
	if (theme !== "note") {
		config.theme = theme === "light" ? "default" : "dark";
	}
	if (format === "png") {
		config.htmlLabels = false;
	}
	return source + `\n%%{init: ${JSON.stringify(config)}}%%\n`;
}
