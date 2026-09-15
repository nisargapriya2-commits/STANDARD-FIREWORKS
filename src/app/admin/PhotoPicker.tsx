"use client";

import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/image-file";

/**
 * The one "choose a picture" control used everywhere in the admin panel —
 * product rows, category rows, the logo, About photos, home banners.
 *
 * Picking a file compresses it in the browser, drops it into hidden fields of the
 * surrounding form and submits that form immediately. For the owner it is simply
 * "choose picture → it's live". There is no separate Save step to forget.
 *
 * `imageChanged` tells the server action whether the picture was touched at all, so
 * editing a price never re-posts (or wipes) the photo.
 */
export default function PhotoPicker({
	alt,
	current,
	addLabel = "+ Add\nphoto",
	size = 56,
	maxDim = 700,
	showRemove = true,
	className = "",
}: {
	alt: string;
	/** Existing picture URL, "" when there is none. */
	current: string;
	addLabel?: string;
	/** Square side of the thumbnail button, in px. */
	size?: number;
	maxDim?: number;
	showRemove?: boolean;
	className?: string;
}) {
	const [preview, setPreview] = useState(current);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState("");
	const dataRef = useRef<HTMLInputElement>(null);
	const flagRef = useRef<HTMLInputElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const boxRef = useRef<HTMLDivElement>(null);

	// The server action revalidates and re-renders us with the saved picture —
	// that's the "done" signal.
	useEffect(() => {
		setPreview(current);
		setBusy(false);
	}, [current]);

	function submitForm() {
		const form = boxRef.current?.closest("form");
		if (form) {
			setBusy(true);
			form.requestSubmit();
		}
	}

	async function onFile(file: File | undefined) {
		if (!file) return;
		setErr("");
		try {
			const dataUrl = await compressImage(file, { maxDim, mime: "image/jpeg" });
			setPreview(dataUrl);
			if (dataRef.current) dataRef.current.value = dataUrl;
			if (flagRef.current) flagRef.current.value = "1";
			submitForm();
		} catch {
			setErr("Couldn't use that file — try a normal photo (JPG or PNG).");
		} finally {
			if (fileRef.current) fileRef.current.value = "";
		}
	}

	function onRemove() {
		setPreview("");
		if (dataRef.current) dataRef.current.value = "";
		if (flagRef.current) flagRef.current.value = "1";
		submitForm();
	}

	return (
		<div ref={boxRef} className={`flex items-center gap-2 ${className}`}>
			<input type="hidden" name="image" ref={dataRef} defaultValue="" />
			<input type="hidden" name="imageChanged" ref={flagRef} defaultValue="0" />
			<input
				ref={fileRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => onFile(e.target.files?.[0])}
			/>

			<button
				type="button"
				onClick={() => fileRef.current?.click()}
				title={preview ? `Change the picture for ${alt}` : `Add a picture for ${alt}`}
				style={{ width: size, height: size }}
				className="relative grid flex-none place-items-center overflow-hidden rounded-lg border border-dashed border-line bg-row text-[11px] font-semibold whitespace-pre-line text-muted hover:border-brand hover:text-brand"
			>
				{preview ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src={preview} alt={alt} className="h-full w-full object-cover" />
				) : (
					<span className="leading-tight">{addLabel}</span>
				)}
				{busy && (
					<span className="absolute inset-0 grid place-items-center bg-white/75 text-[11px] font-bold text-brand">
						saving…
					</span>
				)}
			</button>

			{showRemove && preview && !busy && (
				<button
					type="button"
					onClick={onRemove}
					title="Remove picture"
					className="text-[12px] font-semibold text-muted hover:text-red-600 hover:underline"
				>
					remove
				</button>
			)}
			{err && <span className="text-[11px] font-semibold text-red-600">{err}</span>}
		</div>
	);
}
