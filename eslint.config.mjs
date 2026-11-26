import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	{
		ignores: ["main.js", "*.config.mjs", "version-bump.mjs"],
	},
	...obsidianmd.configs.recommended,
	{
		files: ["src/**/*.test.ts"],
		rules: { "obsidianmd/no-nodejs-modules": "off" },
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
	},
]);
