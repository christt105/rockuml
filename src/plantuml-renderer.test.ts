import { expect, it, beforeEach, vi } from "vitest";
import { PlantUmlRenderer } from "./plantuml-renderer";

const { request, parse, sanitize } = vi.hoisted(() => ({ request: vi.fn(), parse: vi.fn(), sanitize: vi.fn() }));
vi.mock("obsidian", () => ({ requestUrl: request }));
vi.mock("./plantuml-svg", () => ({ parsePlantUmlSvg: parse, sanitizePlantUmlSvg: sanitize }));

const source = "Bob -> Alice : hello";
const endpoint = "https://example.test/plantuml/svg";
const server = "https://example.test/plantuml/";
const doc = {} as Document;
const root = {};

beforeEach(() => {
	vi.resetAllMocks();
	request.mockResolvedValue({ status: 200, text: "svg" });
	parse.mockImplementation((text: string) => text === "svg" ? root : undefined);
	sanitize.mockImplementation(() => ({}));
});

it.each(["", "  ", "file:///plantuml", "http://example.test/?token=x", "https://name:password@example.test"])(
	"gives settings instructions without sending a request for %j", async url => {
		await expect(new PlantUmlRenderer().render(source, url, doc)).rejects.toThrow("RockUML settings");
		expect(request).not.toHaveBeenCalled();
	},
);

it("POSTs the source as plain text and sanitizes the result for the target document", async () => {
	await expect(new PlantUmlRenderer().render(source, server, doc)).resolves.toMatchObject({ syntaxError: false });
	expect(request).toHaveBeenCalledExactlyOnceWith({
		method: "POST", url: endpoint, contentType: "text/plain; charset=utf-8", body: source, throw: false,
	});
	expect(sanitize).toHaveBeenCalledExactlyOnceWith(root, doc);
});

it.each([404, 405, 415, 501])("retries with an encoded GET when POST returns HTTP %s", async status => {
	request.mockResolvedValueOnce({ status, text: "unsupported" });
	await new PlantUmlRenderer().render(source, server, doc);
	expect(request).toHaveBeenNthCalledWith(2, { method: "GET", url: `${endpoint}/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000`, throw: false });
});

it("returns a syntax error SVG for both POST and fallback GET, and caches it", async () => {
	const renderer = new PlantUmlRenderer();
	request.mockResolvedValueOnce({ status: 400, text: "svg" });
	await expect(renderer.render(source, server, doc)).resolves.toMatchObject({ syntaxError: true });
	await expect(renderer.render(source, server, doc)).resolves.toMatchObject({ syntaxError: true });
	expect(request).toHaveBeenCalledTimes(1);
	request.mockResolvedValueOnce({ status: 405, text: "unsupported" }).mockResolvedValueOnce({ status: 400, text: "svg" });
	await expect(renderer.render(source, "https://other.example.test", doc)).resolves.toMatchObject({ syntaxError: true });
	expect(request).toHaveBeenCalledTimes(3);
});

it.each([
	[400, "HTTP 400"], [403, "HTTP 403"], [503, "HTTP 503"], [200, "did not return an SVG"],
])("reports HTTP %s with a non-SVG body and allows retries", async (status, message) => {
	const renderer = new PlantUmlRenderer();
	request.mockResolvedValueOnce({ status, text: "not svg" });
	await expect(renderer.render(source, server, doc)).rejects.toThrow(message);
	expect(request).toHaveBeenCalledTimes(1);
	await expect(renderer.render(source, server, doc)).resolves.toMatchObject({ syntaxError: false });
});

it("reports a connection failure without falling back and retries on the next render", async () => {
	const renderer = new PlantUmlRenderer();
	request.mockRejectedValueOnce(new Error("connection refused"));
	await expect(renderer.render(source, server, doc)).rejects.toThrow("Could not connect to the PlantUML server");
	expect(request).toHaveBeenCalledTimes(1);
	await renderer.render(source, server, doc);
	expect(request).toHaveBeenCalledTimes(2);
});

it("shares requests and gives each render a new SVG, with separate entries by server and source", async () => {
	const renderer = new PlantUmlRenderer();
	const [first, second] = await Promise.all([renderer.render(source, server, doc), renderer.render(source, server.slice(0, -1), doc)]);
	expect(request).toHaveBeenCalledTimes(1);
	expect(first.svg).not.toBe(second.svg);
	await renderer.render(source, "https://other.example.test", doc);
	await renderer.render("Bob -> Alice : bye", server, doc);
	expect(request).toHaveBeenCalledTimes(3);
});
