import type { PngScale } from "./png-scale";

function exportBaseName(noteName: string, diagramNumber: number): string {
	const name = noteName.replace(/[<>:"/\\|?*]/g, "_").replace(/[ .]+$/, "");
	return `${name || "diagram"}-${diagramNumber}`;
}

export function svgExportFileName(noteName: string, diagramNumber: number): string {
	return `${exportBaseName(noteName, diagramNumber)}.svg`;
}

export function pngExportFileName(noteName: string, diagramNumber: number, scale: PngScale): string {
	return `${exportBaseName(noteName, diagramNumber)}@${scale}x.png`;
}
