import { renderMermaid, svgSize } from "./mermaid-render";
import { pngSize, type PngScale } from "./png-scale";
import { rasterizePng } from "./png-raster";
import { pngSource } from "./png-source";

export function svgBlob(svg: SVGSVGElement, fontSource: Element = svg): Blob {
	const copy = svg.cloneNode(true) as SVGSVGElement;
	const font = fontSource.ownerDocument.defaultView?.getComputedStyle(fontSource).getPropertyValue("--font-mermaid").trim();
	if (font) {
		copy.style.setProperty("--font-mermaid", font);
	}
	return new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml;charset=utf-8" });
}

export async function pngBlob(source: string, scale: PngScale, host: HTMLElement): Promise<Blob> {
	const svg = await renderMermaid(pngSource(source), host);
	if (svg.querySelector("foreignObject")) {
		throw new Error("Mermaid could not convert all labels to SVG text for PNG export.");
	}
	const size = pngSize(svgSize(svg), scale);
	svg.style.removeProperty("max-width");
	svg.setAttribute("width", String(size.width));
	svg.setAttribute("height", String(size.height));

	const url = URL.createObjectURL(svgBlob(svg, host));
	try {
		const image = createEl("img");
		image.src = url;
		await image.decode();
		return await rasterizePng(image, size);
	} finally {
		URL.revokeObjectURL(url);
	}
}

export function downloadBlob(blob: Blob, name: string, doc: Document): void {
	const url = URL.createObjectURL(blob);
	const link = doc.body.createEl("a", { attr: { href: url, download: name } });
	link.click();
	link.remove();
	doc.defaultView?.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
