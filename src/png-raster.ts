import { encodePng } from "./png-encoding";
import type { Size } from "./size";

const tileWidth = 4096;
const stripHeight = 128;

export async function rasterizePng(image: HTMLImageElement, size: Size): Promise<Blob> {
	const { width, height } = size;
	const canvas = createEl("canvas");
	const tiled = width > tileWidth || height > tileWidth;
	const context = canvas.getContext("2d", { willReadFrequently: tiled });
	if (!context) {
		throw new Error("The device could not create a canvas for this PNG.");
	}

	try {
		if (!tiled) {
			canvas.width = width;
			canvas.height = height;
			context.drawImage(image, 0, 0);
			return await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(blob => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error("The device could not encode this PNG. Choose a lower scale."));
					}
				}, "image/png");
			});
		}

		const stride = width * 4 + 1;
		let top = 0;
		const scanlines = new ReadableStream<Uint8Array<ArrayBuffer>>({
			pull(controller) {
				if (top >= height) {
					controller.close();
					return;
				}

				const rows = Math.min(stripHeight, height - top);
				const strip = new Uint8Array(stride * rows);
				canvas.height = rows;

				for (let left = 0; left < width; left += tileWidth) {
					const columns = Math.min(tileWidth, width - left);
					canvas.width = columns;
					context.drawImage(image, -left, -top);
					const { data } = context.getImageData(0, 0, columns, rows);
					const rowBytes = columns * 4;
					for (let row = 0; row < rows; row++) {
						strip.set(data.subarray(row * rowBytes, (row + 1) * rowBytes), row * stride + left * 4 + 1);
					}
				}
				top += rows;
				controller.enqueue(strip);
			},
		});
		return await encodePng(size, scanlines);
	} finally {
		canvas.width = canvas.height = 0;
	}
}
