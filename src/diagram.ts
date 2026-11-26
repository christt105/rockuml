export type DiagramLanguage = "mermaid" | "plantuml";

export interface Diagram {
	language: DiagramLanguage;
	source: string;
	noteName: string;
	number: number;
}
