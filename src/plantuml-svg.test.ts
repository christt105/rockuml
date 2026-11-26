import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { build } from "esbuild";
import { expect, it } from "vitest";
import type { parsePlantUmlSvg, plantUmlExportSvg, sanitizePlantUmlSvg } from "./plantuml-svg";

const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium"].find(path => path && existsSync(path));

function checkInBrowser(
	parse: typeof parsePlantUmlSvg,
	sanitize: typeof sanitizePlantUmlSvg,
	exportSvg: typeof plantUmlExportSvg,
	sequence: string,
	syntaxError: string,
) {
	function check(condition: unknown, message: string): asserts condition {
		if (!condition) {
			throw new Error(message);
		}
	}

	function clean(text: string) {
		const root = parse(text);
		check(root, "Expected an SVG root");
		return sanitize(root, document);
	}

	try {
		const svg = clean(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 100 100" onload="document.body.dataset.executed = 'onload'"
			style="background-image: url(https://example.invalid/background)">
			<script>document.body.dataset.executed = 'script'</script>
			<style>@import url(https://example.invalid/style); body { display: none }</style>
			<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">Foreign content</div></foreignObject>
			<animate attributeName="href" to="javascript:alert(1)"/>
			<a xlink:href="javascript:document.body.dataset.executed='link'"><text>Unsafe</text></a>
			<a href="https://example.invalid/" onclick="document.body.dataset.executed = 'onclick'"><text>Safe</text></a>
			<a href="#shape"><text>Local</text></a>
			<rect id="shape" fill="url(https://example.invalid/paint)" width="10" height="10"/>
			<use href="https://example.invalid/resource.svg#shape"/>
			<use href="#shape"/>
			<image href="data:image/svg+xml;base64,PHN2Zy8+"/>
		</svg>`);
		document.body.append(svg);
		svg.dispatchEvent(new Event("load"));
		const [unsafe, safe, local] = Array.from(svg.querySelectorAll("a"));
		unsafe.dispatchEvent(new MouseEvent("click"));
		check(!document.body.dataset.executed, "SVG code executed in the host document");
		check(!svg.querySelector("script, style, foreignObject, animate, [onload], [onclick]"), "Active markup survived");
		check(!unsafe.hasAttribute("href") && !unsafe.hasAttribute("xlink:href"), "Unsafe link survived");
		check(safe.getAttribute("href") === "https://example.invalid/" && safe.getAttribute("rel") === "noopener noreferrer", "HTTP link was lost");
		const shape = svg.querySelector("rect");
		check(shape && !shape.hasAttribute("fill") && !svg.style.backgroundImage, "Remote paint survived");
		check(svg.querySelectorAll("[href]").length === 3, "A remote resource or embedded SVG survived");
		check(local.getAttribute("href") === `#${shape.id}` && svg.querySelector("use[href]")?.getAttribute("href") === `#${shape.id}`,
			"Local references do not resolve inside the sanitized SVG");
		check(!parse("<html>Bad response</html>") && !parse("<!DOCTYPE svg><svg xmlns='http://www.w3.org/2000/svg'/>")
			&& !parse("<svg xmlns='http://www.w3.org/2000/svg'><g></svg>"), "Accepted a non-SVG, doctyped, or malformed response");

		const preview = clean(sequence);
		const second = clean(sequence);
		document.body.append(preview, second);
		const filter = preview.querySelector("filter");
		check(filter?.id && preview.querySelector(`rect[filter='url(#${filter.id})']`), "The diagram lost its shadow filter");
		check(filter.id !== second.querySelector("filter")?.id, "Separate renders share SVG IDs");
		check(preview.viewBox.baseVal.width === 145 && preview.viewBox.baseVal.height === 168, "The diagram lost its dimensions");
		check(preview.textContent?.includes("Handshake") && preview.style.backgroundColor === "rgb(253, 246, 227)", "The diagram lost its text or background");
		const dashed = preview.querySelector("line[style*='stroke-dasharray']");
		check(dashed && getComputedStyle(dashed).strokeDasharray === "5px, 5px", "The diagram lost its inline stroke style");
		const exported = exportSvg(preview);
		check(!exported.style.backgroundColor && exported.querySelectorAll("rect").length === preview.querySelectorAll("rect").length - 1,
			"The export kept the PlantUML canvas background or removed other rectangles");
		check(preview.style.backgroundColor, "Preparing an export changed the note preview");
		const plain = clean(sequence.replace('background:#FDF6E3;', '').replace('<rect fill="#FDF6E3" height="168" style="stroke:none;stroke-width:1;" width="145" x="0" y="0"/>', ''));
		check(exportSvg(plain).querySelectorAll("rect").length === plain.querySelectorAll("rect").length,
			"An export without a canvas rectangle lost diagram shapes");
		const error = clean(syntaxError);
		document.body.append(error);
		check(error.textContent?.includes("Syntax Error?") && error.viewBox.baseVal.width > 0, "The real PlantUML syntax error is missing");
		document.body.dataset.result = "passed";
	} catch (error) {
		document.body.dataset.result = error instanceof Error ? error.message : String(error);
	}
}

it.skipIf(!chrome && !process.env.CI)("preserves real PlantUML diagrams and strips active markup in Chromium", async () => {
	expect(chrome, "Set CHROME_BIN to run the SVG browser regression test").toBeDefined();
	const sequence = readFileSync(new URL("./fixtures/sequence.svg", import.meta.url), "utf8");
	const syntaxError = readFileSync(new URL("./fixtures/syntax-error.svg", import.meta.url), "utf8");
	const bundle = await build({
		stdin: {
			contents: `import { parsePlantUmlSvg, plantUmlExportSvg, sanitizePlantUmlSvg } from "./plantuml-svg";
				(${checkInBrowser.toString()})(parsePlantUmlSvg, sanitizePlantUmlSvg, plantUmlExportSvg, ${JSON.stringify(sequence)}, ${JSON.stringify(syntaxError)});`,
			resolveDir: new URL(".", import.meta.url).pathname,
		},
		bundle: true,
		write: false,
	});
	const html = `<body><script>${bundle.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script></body>`;
	const output = execFileSync(chrome!, [
		"--headless", "--no-sandbox", "--disable-background-networking", "--host-resolver-rules=MAP * ~NOTFOUND",
		"--dump-dom", `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
	], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 15000 });
	const result = /<body data-result="([^"]*)"/.exec(output)?.[1];
	expect(result).toBe("passed");
}, 20000);
