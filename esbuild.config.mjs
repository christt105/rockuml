import esbuild from "esbuild";
import process from "node:process";
import { builtinModules } from "node:module";

const prod = process.argv[2] === "production";
const options = {
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/*",
		"@lezer/*",
		...builtinModules,
	],
	format: "cjs",
	target: "es2018",
	supported: { "dynamic-import": false },
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	minify: prod,
	outfile: "main.js",
};

if (prod) {
	await esbuild.build(options);
} else {
	const context = await esbuild.context(options);
	await context.watch();
}
