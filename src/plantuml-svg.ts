const svgNamespace = "http://www.w3.org/2000/svg";
const xlinkNamespace = "http://www.w3.org/1999/xlink";
const elements = new Set([
	"svg", "g", "defs", "symbol", "use", "a", "image", "title", "desc",
	"path", "rect", "line", "polyline", "polygon", "circle", "ellipse", "text", "tspan", "textPath",
	"linearGradient", "radialGradient", "stop", "pattern", "marker", "clipPath", "mask", "filter",
	"feBlend", "feColorMatrix", "feComposite", "feDropShadow", "feFlood", "feGaussianBlur", "feMerge",
	"feMergeNode", "feOffset",
]);
const paint = new Set([
	"fill", "stroke", "filter", "clip-path", "mask", "marker-start", "marker-mid", "marker-end",
]);
const styles = [
	...paint, "color", "fill-opacity", "fill-rule", "stroke-width", "stroke-opacity", "stroke-linecap",
	"stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "opacity", "clip-rule",
	"font-family", "font-size", "font-style", "font-weight", "text-anchor", "dominant-baseline",
	"text-decoration", "letter-spacing", "stop-color", "stop-opacity", "flood-color", "flood-opacity",
];
const attributes = new Set([
	...styles, "viewBox", "preserveAspectRatio", "width", "height", "x", "y", "x1", "y1", "x2", "y2",
	"cx", "cy", "r", "rx", "ry", "dx", "dy", "d", "points", "transform", "textLength", "lengthAdjust",
	"rotate", "gradientUnits", "gradientTransform", "spreadMethod", "fx", "fy", "fr", "offset",
	"patternUnits", "patternContentUnits", "patternTransform", "clipPathUnits", "maskUnits", "maskContentUnits",
	"filterUnits", "primitiveUnits", "in", "in2", "result", "type", "values", "mode", "operator", "stdDeviation",
	"markerWidth", "markerHeight", "markerUnits", "refX", "refY", "orient", "startOffset",
]);
const fragment = /^#[\w.:-]+$/;
const localPaint = /^url\(\s*(["']?)(#[\w.:-]+)\1\s*\)$/i;
const plainPaint = /^(?:[\w.,%# +-]+|(?:rgba?|hsla?)\([\d.,% /+-]+\))$/i;

export function parsePlantUmlSvg(text: string): Element | undefined {
	const parsed = new DOMParser().parseFromString(text, "image/svg+xml");
	const root = parsed.documentElement;
	if (!parsed.doctype && root.namespaceURI === svgNamespace && root.localName === "svg"
		&& !parsed.getElementsByTagName("parsererror").length) {
		return root;
	}
}

export function sanitizePlantUmlSvg(root: Element, doc: Document): SVGSVGElement {
	const prefix = `rockuml-plantuml-${Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16)).join("-")}-`;
	const ids = new Map<string, string>();
	const localId = (id: string) => {
		const mapped = ids.get(id) ?? `${prefix}${ids.size}`;
		ids.set(id, mapped);
		return mapped;
	};
	const paintValue = (value: string) => {
		const match = localPaint.exec(value);
		return match ? `url(#${localId(match[2].slice(1))})` : plainPaint.test(value) ? value : "";
	};

	const copy = (source: SVGElement): SVGElement => {
		const tag = source.localName;
		const clean = doc.createElementNS(svgNamespace, tag);
		for (const attr of Array.from(source.attributes)) {
			if (attr.namespaceURI === null && attributes.has(attr.name)) {
				const value = paint.has(attr.name) ? paintValue(attr.value.trim()) : attr.value;
				if (value) {
					clean.setAttribute(attr.name, value);
				}
			}
		}
		if (source.id) {
			clean.id = localId(source.id);
		}
		for (const property of styles) {
			const original = source.style?.getPropertyValue(property) ?? "";
			const value = paint.has(property) ? paintValue(original) : original;
			if (value) {
				clean.style.setProperty(property, value);
			}
		}
		if (source === root && source.style?.backgroundColor) {
			clean.style.backgroundColor = source.style.backgroundColor;
		}

		const href = (source.getAttribute("href") ?? source.getAttributeNS(xlinkNamespace, "href"))?.trim();
		if (href) {
			if (["a", "use", "textPath", "linearGradient", "radialGradient", "pattern"].includes(tag) && fragment.test(href)) {
				clean.setAttribute("href", `#${localId(href.slice(1))}`);
			} else if (tag === "a" && /^https?:\/\//i.test(href) && URL.canParse(href)) {
				clean.setAttribute("href", new URL(href).href);
				clean.setAttribute("target", "_blank");
				clean.setAttribute("rel", "noopener noreferrer");
			} else if (tag === "image" && /^data:image\/(?:png|jpeg|gif|webp);base64,[\w+/=]+$/i.test(href)) {
				clean.setAttribute("href", href);
			}
		}

		for (const child of Array.from(source.childNodes)) {
			if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
				clean.append(doc.createTextNode(child.nodeValue ?? ""));
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				const element = child as SVGElement;
				if (element.namespaceURI === svgNamespace && elements.has(element.localName)) {
					clean.append(copy(element));
				}
			}
		}
		return clean;
	};

	return copy(root as SVGElement) as SVGSVGElement;
}

export function plantUmlExportSvg(svg: SVGSVGElement): SVGSVGElement {
	const copy = svg.cloneNode(true) as SVGSVGElement;
	copy.style.removeProperty("background-color");
	const background = copy.querySelector<SVGRectElement>(":scope > g:first-of-type > rect:first-child");
	const width = svg.hasAttribute("width") ? svg.width.baseVal.value : svg.viewBox.baseVal.width;
	const height = svg.hasAttribute("height") ? svg.height.baseVal.value : svg.viewBox.baseVal.height;
	if (background?.style.stroke === "none" && !background.hasAttribute("transform")
		&& background.x.baseVal.value === 0 && background.y.baseVal.value === 0
		&& background.rx.baseVal.value === 0 && background.ry.baseVal.value === 0
		&& background.width.baseVal.value === width && background.height.baseVal.value === height) {
		background.remove();
	}
	return copy;
}
