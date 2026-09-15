"use client";

import { useState } from "react";
import { compressImage } from "@/lib/image-file";

/**
 * File → compressed data URL held in a hidden input, so it submits with the settings form.
 * PNG keeps a QR code crisp; a photo of a QR taken on a phone still gets downscaled to fit.
 */
const toDataUrl = (file: File) =>
	compressImage(file, { maxDim: 600, mime: "image/png", maxBytes: 400_000 });

export default function ImageInput({
	name,
	label,
	defaultValue,
}: {
	name: string;
	label: string;
	defaultValue: string;
}) {
	const [val, setVal] = useState(defaultValue);
	const [err, setErr] = useState("");
	const [busy, setBusy] = useState(false);

	async function onFile(file: File | undefined) {
		if (!file) return;
		setErr("");
		setBusy(true);
		try {
			setVal(await toDataUrl(file));
		} catch {
			// This used to be swallowed silently: the owner picked a file, nothing
			// happened, and there was no way to tell whether it had worked. A HEIC
			// straight off an iPhone is the usual culprit — the browser can't decode
			// it, so say so instead of leaving him clicking.
			setErr("Couldn't read that image. Try a JPG or PNG (iPhone HEIC photos often fail).");
		} finally {
			setBusy(false);
		}
	}

	return (
		<label className="block text-[15px] font-semibold text-ink">
			{label}
			<input type="hidden" name={name} value={val} />
			<div className="mt-1.5 flex items-center gap-3">
				{val ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={val} alt={label} className="h-20 w-20 rounded-lg border border-line bg-white object-contain p-1" />
				) : (
					<span className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-line text-[12px] text-muted">none yet</span>
				)}
				<input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="text-[13px] text-ink-soft file:mr-2 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-row file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-ink hover:file:bg-shell" />
				{busy && <span className="text-[13px] font-semibold text-muted">processing…</span>}
				{val && !busy && (
					<button type="button" onClick={() => setVal("")} className="text-[13px] font-semibold text-brand hover:underline">
						remove
					</button>
				)}
			</div>
			{err && (
				<p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] font-medium text-red-700">
					{err}
				</p>
			)}
		</label>
	);
}
