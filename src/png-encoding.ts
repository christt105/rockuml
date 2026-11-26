import type { Size } from "./size";

const crcTable = Uint32Array.from({ length: 256 }, (_, byte) => {
	let crc = byte;
	for (let bit = 0; bit < 8; bit++) {
		crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
	}
	return crc;
});

function chunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(12 + data.length);
	const view = new DataView(bytes.buffer);
	view.setUint32(0, data.length);
	bytes.set(new TextEncoder().encode(type), 4);
	bytes.set(data, 8);
	let crc = 0xffffffff;
	for (let index = 4; index < 8 + data.length; index++) {
		crc = crcTable[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
	}
	view.setUint32(8 + data.length, crc ^ 0xffffffff);
	return bytes;
}

export async function encodePng(size: Size, scanlines: ReadableStream<Uint8Array<ArrayBuffer>>): Promise<Blob> {
	const header = new Uint8Array(13);
	const view = new DataView(header.buffer);
	view.setUint32(0, size.width);
	view.setUint32(4, size.height);
	header[8] = 8;
	header[9] = 6;

	const parts = [
		Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10),
		chunk("IHDR", header),
	];
	const compressed = scanlines.pipeThrough(new CompressionStream("deflate")).getReader();
	for (;;) {
		const { value, done } = await compressed.read();
		if (done) {
			break;
		}
		parts.push(chunk("IDAT", value));
	}
	parts.push(chunk("IEND", new Uint8Array()));
	return new Blob(parts, { type: "image/png" });
}
