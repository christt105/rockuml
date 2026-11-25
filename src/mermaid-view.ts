import { ItemView, setIcon, type WorkspaceLeaf } from "obsidian";
import type { Diagram } from "./diagram";
import { renderMermaid, svgSize } from "./mermaid-render";
import { boundedScale, fitDiagram, pan, zoomAt } from "./pan-zoom";
import type { Point } from "./point";
import type { Size } from "./size";
import type { Transform } from "./transform";

export const mermaidViewType = "rockuml-mermaid";

export class MermaidView extends ItemView {
	private viewport!: HTMLElement;
	private stage!: HTMLElement;
	private status!: HTMLElement;
	private size?: Size;
	private transform: Transform = { x: 0, y: 0, scale: 1 };
	private fitting = true;
	private drag?: { pointerId: number; point: Point };

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	override getViewType(): string {
		return mermaidViewType;
	}

	override getDisplayText(): string {
		return "Mermaid viewer";
	}

	override getIcon(): string {
		return "workflow";
	}

	protected override onOpen(): Promise<void> {
		this.contentEl.addClass("rockuml-view");
		const controls = this.contentEl.createDiv({ cls: "rockuml-view-controls", attr: { role: "group", "aria-label": "Diagram zoom" } });
		const button = (label: string, icon: string, action: () => void) => {
			const control = controls.createEl("button", { attr: { type: "button", title: label, "aria-label": label } });
			setIcon(control, icon);
			this.registerDomEvent(control, "click", action);
		};
		button("Fit to window", "scan", () => this.fit());
		button("Actual size (100%)", "maximize", () => this.zoom(this.center(), 1));
		button("Zoom out", "minus", () => this.zoom(this.center(), this.transform.scale / 1.25));
		button("Zoom in", "plus", () => this.zoom(this.center(), this.transform.scale * 1.25));

		this.viewport = this.contentEl.createDiv("rockuml-viewport");
		this.stage = this.viewport.createDiv("rockuml-stage mermaid");
		this.status = this.viewport.createDiv({ cls: "rockuml-view-status", text: "Open a Mermaid diagram from a note.", attr: { role: "status" } });

		this.registerDomEvent(this.viewport, "wheel", event => {
			if (!this.size) {
				return;
			}
			event.preventDefault();
			const box = this.viewport.getBoundingClientRect();
			const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.viewport.clientHeight : 1;
			this.zoom({ x: event.clientX - box.left, y: event.clientY - box.top }, this.transform.scale * Math.exp(-event.deltaY * unit * 0.002));
		}, { passive: false });
		this.registerDomEvent(this.viewport, "pointerdown", event => {
			if (!this.size || this.drag || event.button !== 0) {
				return;
			}
			this.viewport.setPointerCapture(event.pointerId);
			this.viewport.addClass("is-dragging");
			this.drag = { pointerId: event.pointerId, point: { x: event.clientX, y: event.clientY } };
		});
		this.registerDomEvent(this.viewport, "pointermove", event => {
			if (this.drag?.pointerId !== event.pointerId) {
				return;
			}
			const point = { x: event.clientX, y: event.clientY };
			this.apply(pan(this.transform, { x: point.x - this.drag.point.x, y: point.y - this.drag.point.y }));
			this.drag.point = point;
			this.fitting = false;
		});
		this.registerDomEvent(this.viewport, "lostpointercapture", event => {
			if (this.drag?.pointerId === event.pointerId) {
				this.drag = undefined;
				this.viewport.removeClass("is-dragging");
			}
		});
		return Promise.resolve();
	}

	override onResize(): void {
		if (this.fitting) {
			this.fit();
		}
	}

	async show(diagram: Diagram): Promise<void> {
		this.status.setText("Rendering diagram…");
		try {
			const svg = await renderMermaid(diagram.source, this.contentEl);
			this.size = svgSize(svg);
			this.stage.style.width = `${this.size.width}px`;
			this.stage.style.height = `${this.size.height}px`;
			this.stage.replaceChildren(svg);
			this.status.hidden = true;
			this.fit();
		} catch (error) {
			this.status.setText(error instanceof Error ? error.message : "Mermaid could not render this diagram.");
		}
	}

	private center(): Point {
		return { x: this.viewport.clientWidth / 2, y: this.viewport.clientHeight / 2 };
	}

	private fit(): void {
		const fit = this.fitTransform();
		if (fit) {
			this.fitting = true;
			this.apply(fit);
		}
	}

	private fitTransform(): Transform | undefined {
		if (this.size && this.viewport.clientWidth && this.viewport.clientHeight) {
			return fitDiagram({ width: this.viewport.clientWidth, height: this.viewport.clientHeight }, this.size);
		}
		return undefined;
	}

	private zoom(point: Point, scale: number): void {
		const fit = this.fitTransform();
		if (fit) {
			this.fitting = false;
			this.apply(zoomAt(this.transform, point, boundedScale(scale, fit.scale)));
		}
	}

	private apply(transform: Transform): void {
		this.transform = transform;
		this.stage.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
	}
}
