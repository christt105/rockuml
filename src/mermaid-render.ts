import { loadMermaid } from "obsidian";

interface Mermaid {
	render(id: string, source: string, container: HTMLElement): Promise<{ svg: string }>;
}

export async function renderMermaid(source: string, host: HTMLElement): Promise<SVGSVGElement> {
	const mermaid = await loadMermaid() as Mermaid;
	const id = "rockuml-" + Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8, "0")).join("");
	const container = host.createDiv({ cls: "rockuml-render mermaid" });
	try {
		const { svg } = await mermaid.render(id, source, container);
		const result = new DOMParser().parseFromString(svg, "text/html").body.firstElementChild;
		if (result?.localName !== "svg" || result.namespaceURI !== "http://www.w3.org/2000/svg") {
			throw new Error("Mermaid did not return an SVG diagram.");
		}
		return host.ownerDocument.importNode(result, true) as SVGSVGElement;
	} finally {
		container.remove();
	}
}
