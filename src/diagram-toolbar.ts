import { Menu, Notice, setIcon } from "obsidian";
import { createControlGroup } from "./control-group";
import { downloadBlob, pngBlob, svgBlob } from "./diagram-export";
import type { Diagram } from "./diagram";
import { exportBackgroundColor } from "./export-background";
import { pngExportFileName, svgExportFileName } from "./export-file-name";
import { mermaidExportSource } from "./mermaid-export-source";
import { renderMermaid } from "./mermaid-render";
import { pngScales } from "./png-scale";
import type { RockUmlSettings } from "./settings/rockuml-settings";

export function diagramToolbar(
	element: HTMLElement,
	getDiagram: () => Diagram | Promise<Diagram>,
	open: (diagram: Diagram) => Promise<void>,
	getSettings: () => RockUmlSettings,
): HTMLElement {
	element.querySelector(":scope > .rockuml-toolbar")?.remove();
	const toolbar = createControlGroup(element, "rockuml-toolbar", "Mermaid diagram");
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
		const svg = settings.exportTheme === "note" ? noteSvg
			: await renderMermaid(mermaidExportSource(source, settings.exportTheme, "svg"), doc.body);
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
						const blob = await pngBlob(source, scale, doc.body, settings.exportTheme, backgroundColor(settings));
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
		new Notice("Mermaid source copied.");
	}));
	return toolbar;
}
