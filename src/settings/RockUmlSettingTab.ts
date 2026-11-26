import { PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type { RockUmlSettings } from "./rockuml-settings";

export class RockUmlSettingTab extends PluginSettingTab {
	override getSettingDefinitions(): SettingDefinitionItem<keyof RockUmlSettings>[] {
		return [
			{
				type: "group",
				items: [
					{
						name: "Export theme",
						desc: "Color theme for SVG and PNG exports.",
						control: {
							type: "dropdown",
							key: "exportTheme",
							options: { note: "As in the note", light: "Light", dark: "Dark" },
						},
					},
					{
						name: "Export background",
						desc: "Use a transparent background or fill it with the export theme's background color.",
						control: {
							type: "dropdown",
							key: "exportBackground",
							options: { transparent: "Transparent", solid: "Solid" },
						},
					},
				],
			},
		];
	}
}
