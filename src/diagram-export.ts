import { pngSize, type PngScale } from "./png-scale";
import { rasterizePng } from "./png-raster";
import { svgSize } from "./svg-size";

export function svgBlob(svg: SVGSVGElement, fontSource: Element, background?: string): Blob {
	const copy = svg.cloneNode(true) as SVGSVGElement;
	const font = fontSource.ownerDocument.defaultView?.getComputedStyle(fontSource).getPropertyValue("--font-mermaid").trim();
	if (font) {
		copy.style.setProperty("--font-mermaid", font);
	}
	if (background) {
		const { x, y, width, height } = svg.viewBox.baseVal;
		const rect = copy.createSvg("rect", { attr: { x, y, width, height } });
		rect.setCssProps({ fill: background, stroke: "none" });
		copy.prepend(rect);
	}
	return new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml;charset=utf-8" });
}

export async function pngBlob(svg: SVGSVGElement, scale: PngScale, fontSource: Element, background?: string): Promise<Blob> {
	if (svg.querySelector("foreignObject")) {
		throw new Error("Mermaid could not convert all labels to SVG text for PNG export.");
	}
	const size = pngSize(svgSize(svg), scale);
	svg.style.removeProperty("max-width");
	svg.setAttribute("width", String(size.width));
	svg.setAttribute("height", String(size.height));

	const url = URL.createObjectURL(svgBlob(svg, fontSource));
	try {
		const image = createEl("img");
		image.src = url;
		await image.decode();
		return await rasterizePng(image, size, background);
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
