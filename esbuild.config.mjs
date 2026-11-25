import esbuild from "esbuild";
import process from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { builtinModules } from "node:module";

const prod = process.argv[2] === "production";
const metafilePath = process.env.ESBUILD_METAFILE;

const stripElkMermaidRuntime = {
	name: "strip-elk-mermaid-runtime",
	setup(build) {
		build.onLoad({ filter: /mermaid-layout-elk\.core[\\/]render-[^\\/]+\.mjs$/ }, async ({ path }) => {
			const source = await readFile(path, "utf8");
			const rendererStart = source.indexOf("// src/render.ts");
			const configCall = "mermaid_default.mermaidAPI.setConfig(elkContext.getConfig());";
			if (rendererStart === -1 || !source.includes(configCall)) {
				throw new Error("Unexpected @mermaid-js/layout-elk renderer. Check the runtime stripping step.");
			}

			const renderer = source.slice(rendererStart).replace(configCall, "setConfig(elkContext.getConfig());");
			return {
				contents: `
					import { createCommonLayoutRenderer } from "./chunk-FUZGIM3Y.mjs";
					import { setConfig } from "./chunk-W7FHEGFS.mjs";
					import { __name } from "./chunk-Q5MVOS3D.mjs";
					${renderer}
				`,
				loader: "js",
			};
		});
	},
};

const options = {
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"mermaid",
		"mermaid/*",
		"electron",
		"@codemirror/*",
		"@lezer/*",
		...builtinModules,
	],
	plugins: [stripElkMermaidRuntime],
	format: "cjs",
	target: "es2018",
	supported: { "dynamic-import": false },
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	minify: prod,
	outfile: "main.js",
};

if (prod) {
	const result = await esbuild.build({ ...options, metafile: Boolean(metafilePath) });
	if (metafilePath && result.metafile) {
		await writeFile(metafilePath, JSON.stringify(result.metafile, null, 2) + "\n");
	}
} else {
	const context = await esbuild.context(options);
	await context.watch();
}
