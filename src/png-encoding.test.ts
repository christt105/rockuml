import { expect, it } from "vitest";
import { encodePng } from "./png-encoding";

it("writes the dimensions and complete RGBA scanlines to a PNG", async () => {
	const rows = [
		Uint8Array.of(0, 255, 0, 0, 255, 0, 255, 0, 255),
		Uint8Array.of(0, 0, 0, 255, 255, 0, 0, 0, 0),
	];
	const scanlines = new ReadableStream<Uint8Array<ArrayBuffer>>({
		start(controller) {
			rows.forEach(row => controller.enqueue(row));
			controller.close();
		},
	});
	const blob = await encodePng({ width: 2, height: 2 }, scanlines);
	const bytes = new Uint8Array(await blob.arrayBuffer());
	const view = new DataView(bytes.buffer);
	const tag = (offset: number) => new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8));

	expect(blob.type).toBe("image/png");
	expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
	expect(tag(8)).toBe("IHDR");
	expect(view.getUint32(16)).toBe(2);
	expect(view.getUint32(20)).toBe(2);
	expect(view.getUint32(29)).toBe(0x72b60d24);
	const compressed: Uint8Array<ArrayBuffer>[] = [];
	for (let offset = 33; tag(offset) === "IDAT";) {
		const length = view.getUint32(offset);
		compressed.push(bytes.subarray(offset + 8, offset + 8 + length));
		offset += length + 12;
	}
	expect(tag(bytes.length - 12)).toBe("IEND");
	const decoded = new Blob(compressed).stream().pipeThrough(new DecompressionStream("deflate"));
	expect(await new Response(decoded).arrayBuffer()).toEqual(await new Blob(rows).arrayBuffer());
});
