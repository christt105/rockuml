const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

export async function encodePlantUml(source: string): Promise<string> {
	const stream = new Blob([source]).stream().pipeThrough(new CompressionStream("deflate-raw"));
	const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
	let encoded = "";
	for (let index = 0; index < bytes.length; index += 3) {
		const first = bytes[index];
		const second = bytes[index + 1] ?? 0;
		const third = bytes[index + 2] ?? 0;
		encoded += alphabet[first >> 2] + alphabet[((first & 3) << 4) | (second >> 4)]
			+ alphabet[((second & 15) << 2) | (third >> 6)] + alphabet[third & 63];
	}
	return encoded;
}
