import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	{
		ignores: ["main.js", "*.config.mjs", "version-bump.mjs"],
	},
	...obsidianmd.configs.recommended,
	{
		rules: {
			"obsidianmd/ui/sentence-case": ["warn", {
				acronyms: ["ELK"],
			}],
		},
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
]);
