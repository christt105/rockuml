import { Menu, Notice, setIcon } from "obsidian";
import { createControlGroup } from "./control-group";
import { downloadBlob, pngBlob, svgBlob } from "./diagram-export";
import type { Diagram, DiagramLanguage } from "./diagram";
import { exportBackgroundColor } from "./export-background";
import { pngExportFileName, svgExportFileName } from "./export-file-name";
import { mermaidExportSource } from "./mermaid-export-source";
import { renderMermaid } from "./mermaid-render";
import { plantUmlExportSvg } from "./plantuml-svg";
import { pngScales } from "./png-scale";
import type { RockUmlSettings } from "./settings/rockuml-settings";

export function diagramToolbar(
	element: HTMLElement,
	getDiagram: () => Diagram | Promise<Diagram>,
	open: (diagram: Diagram) => Promise<void>,
	getSettings: () => RockUmlSettings,
	language: DiagramLanguage = "mermaid",
): HTMLElement {
	element.querySelector(":scope > .rockuml-toolbar")?.remove();
	const label = language === "mermaid" ? "Mermaid" : "PlantUML";
	const toolbar = createControlGroup(element, "rockuml-toolbar", `${label} diagram`);
	const doc = element.ownerDocument;

	const backgroundColor = (settings: RockUmlSettings) => {
		const noteColor = element.win.getComputedStyle(element).getPropertyValue("--background-primary").trim()
			|| (element.closest(".theme-dark") ? "#333333" : "#ffffff");
		return exportBackgroundColor(settings, noteColor);
	};

	const run = (action: (diagram: Diagram) => void | Promise<void>) => {
		void Promise.resolve().then(getDiagram).then(action).catch((error: unknown) => {
			new Notice(error instanceof Error ? error.message : "The diagram action failed.");
		});
	};
	const getSvg = () => {
		const svg = element.querySelector<SVGSVGElement>(":scope > svg");
		if (!svg) {
			throw new Error("The diagram is no longer available.");
		}
		return svg;
	};
	const exportSvg = async (source: string, settings: RockUmlSettings, format: "svg" | "png") => {
		if (language === "plantuml") {
			return plantUmlExportSvg(getSvg());
		}
		if (format === "svg" && settings.exportTheme === "note") {
			return getSvg();
		}
		return renderMermaid(mermaidExportSource(source, settings.exportTheme, format), doc.body);
	};
	const button = (label: string, icon: string, action: (control: HTMLButtonElement) => void) => {
		const control = toolbar.createEl("button", { attr: { type: "button", "aria-label": label, title: label } });
		setIcon(control, icon);
		control.addEventListener("click", event => {
			event.stopPropagation();
			action(control);
		});
	};

	button("Open in tab", "maximize-2", () => run(open));
	button("Export SVG", "download", () => run(async ({ source, noteName, number }) => {
		const settings = getSettings();
		const background = backgroundColor(settings);
		const noteSvg = getSvg();
		const svg = await exportSvg(source, settings, "svg");
		downloadBlob(svgBlob(svg, noteSvg, background), svgExportFileName(noteName, number), doc);
	}));
	button("Export PNG", "image", control => {
		const box = control.getBoundingClientRect();
		const menu = new Menu();
		for (const scale of pngScales) {
			menu.addItem(item => item.setTitle(`Export PNG at ${scale}×`).onClick(() => {
				run(async ({ source, noteName, number }) => {
					const settings = getSettings();
					const progress = new Notice("Preparing PNG…", 0);
					control.disabled = true;
					try {
						const svg = await exportSvg(source, settings, "png");
						const blob = await pngBlob(svg, scale, doc.body, backgroundColor(settings));
						downloadBlob(blob, pngExportFileName(noteName, number, scale), doc);
					} finally {
						progress.hide();
						control.disabled = false;
					}
				});
			}));
		}
		menu.showAtPosition({ x: box.left, y: box.bottom }, doc);
	});
	button("Copy source", "copy", () => run(async ({ source }) => {
		await element.win.navigator.clipboard.writeText(source);
		new Notice(`${label} source copied.`);
	}));
	return toolbar;
}
