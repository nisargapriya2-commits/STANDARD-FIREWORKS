/**
 * Browser-side image compression, shared by every "upload a picture" control in the
 * admin panel (product photos, logo, UPI QR).
 *
 * Everything the owner uploads is stored in D1 as a data URL, and it travels there
 * inside a server-action POST — so it has to be SMALL. A phone camera JPEG is 3–8 MB;
 * we downscale it and step the JPEG quality down until it fits `maxBytes`.
 *
 * Runs in the browser only (uses canvas) — call it from client components.
 */

export type CompressOpts = {
	/** Longest side, in px, after downscaling. */
	maxDim?: number;
	/** "image/jpeg" for photos, "image/png" for logos/QR codes (keeps them crisp). */
	mime?: "image/jpeg" | "image/png";
	/** Starting JPEG quality. Ignored for PNG. */
	quality?: number;
	/** Hard ceiling for the resulting data-URL string length. */
	maxBytes?: number;
};

export class ImageTooLargeError extends Error {}

export async function compressImage(file: File, opts: CompressOpts = {}): Promise<string> {
	const { maxDim = 700, mime = "image/jpeg", quality = 0.82, maxBytes = 400_000 } = opts;

	const bitmapUrl = await readAsDataUrl(file);
	const img = await loadImage(bitmapUrl);

	let dim = maxDim;
	let q = quality;

	// Step down quality first, then physical size, until it fits.
	for (let attempt = 0; attempt < 6; attempt++) {
		const out = draw(img, dim, mime, q);
		if (out.length <= maxBytes) return out;
		if (mime === "image/jpeg" && q > 0.5) q -= 0.12;
		else dim = Math.round(dim * 0.75);
	}

	const final = draw(img, dim, mime, q);
	if (final.length > maxBytes) {
		throw new ImageTooLargeError("Could not compress this image small enough.");
	}
	return final;
}

function draw(img: HTMLImageElement, maxDim: number, mime: string, quality: number): string {
	const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
	const c = document.createElement("canvas");
	c.width = Math.max(1, Math.round(img.width * scale));
	c.height = Math.max(1, Math.round(img.height * scale));
	const ctx = c.getContext("2d");
	if (!ctx) throw new Error("Canvas unavailable");
	// JPEG has no alpha — paint white first so transparent PNGs don't come out black.
	if (mime === "image/jpeg") {
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, c.width, c.height);
	}
	ctx.drawImage(img, 0, 0, c.width, c.height);
	return c.toDataURL(mime, quality);
}

function readAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result as string);
		r.onerror = () => reject(new Error("Could not read the file"));
		r.readAsDataURL(file);
	});
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("That file is not a readable image"));
		img.src = src;
	});
}
