export function pngSource(source: string): string {
	return source + '\n%%{init: {"htmlLabels": false}}%%\n';
}
