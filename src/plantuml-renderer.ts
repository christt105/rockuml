import { requestUrl, type RequestUrlParam } from "obsidian";
import { encodePlantUml } from "./plantuml-encoding";
import { parsePlantUmlSvg, sanitizePlantUmlSvg } from "./plantuml-svg";

const unsupportedPost = [404, 405, 415, 501];
const cacheCapacity = 64;

function svgEndpoint(serverUrl: string): string {
	if (!serverUrl.trim()) {
		throw new Error("Set a PlantUML server URL in RockUML settings, then reopen this note or viewer.");
	}
	const base = URL.canParse(serverUrl) ? new URL(serverUrl) : undefined;
	if (!base || !["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
		throw new Error("Enter an HTTP or HTTPS PlantUML server base URL in RockUML settings.");
	}
	base.pathname = `${base.pathname.replace(/\/+$/, "")}/svg`;
	return base.href;
}

function hashSource(source: string): number {
	let hash = 2166136261;
	for (let index = 0; index < source.length; index++) {
		hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
	}
	return hash >>> 0;
}

async function requestDiagram(params: RequestUrlParam) {
	try {
		return await requestUrl({ ...params, throw: false });
	} catch {
		throw new Error("Could not connect to the PlantUML server. Check the server URL and your connection.");
	}
}

async function loadDiagram(endpoint: string, source: string) {
	let response = await requestDiagram({ url: endpoint, method: "POST", contentType: "text/plain; charset=utf-8", body: source });
	if (unsupportedPost.includes(response.status)) {
		const encoded = await encodePlantUml(source);
		response = await requestDiagram({ url: `${endpoint}/${encoded}`, method: "GET" });
	}
	const { status } = response;
	const syntaxError = status === 400;
	if (syntaxError || (status >= 200 && status < 300)) {
		const root = parsePlantUmlSvg(response.text);
		if (root) {
			return { root, syntaxError };
		}
		if (!syntaxError) {
			throw new Error("The PlantUML server did not return an SVG diagram.");
		}
	}
	throw new Error(`The PlantUML server returned HTTP ${status}.`);
}

export class PlantUmlRenderer {
	private readonly cache = new Map<string, { source: string; response: ReturnType<typeof loadDiagram> }>();

	async render(source: string, serverUrl: string, doc: Document) {
		const endpoint = svgEndpoint(serverUrl);
		const key = `${endpoint}:${hashSource(source)}`;
		let entry = this.cache.get(key);
		this.cache.delete(key);
		if (entry?.source !== source) {
			entry = { source, response: loadDiagram(endpoint, source) };
		}
		this.cache.set(key, entry);
		if (this.cache.size > cacheCapacity) {
			const oldest = this.cache.keys().next();
			if (!oldest.done) {
				this.cache.delete(oldest.value);
			}
		}
		try {
			const { root, syntaxError } = await entry.response;
			return { svg: sanitizePlantUmlSvg(root, doc), syntaxError };
		} catch (error) {
			if (this.cache.get(key) === entry) {
				this.cache.delete(key);
			}
			throw error;
		}
	}
}
