"use client";

import { useEffect, useState } from "react";

/**
 * Drop-in replacement for a plain <img> that pops the picture full-size in an
 * overlay on click — for product/category photos and site galleries where
 * the thumbnail is too small to see detail. Each instance owns its own
 * open/closed state, so no shared lightbox context is needed.
 */
export default function Zoomable({
	src,
	alt,
	className,
	loading,
	decoding,
	fetchPriority,
}: {
	src: string;
	alt: string;
	className?: string;
	loading?: "eager" | "lazy";
	decoding?: "async" | "sync" | "auto";
	fetchPriority?: "high" | "low" | "auto";
}) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [open]);

	return (
		<>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={src}
				alt={alt}
				loading={loading}
				decoding={decoding}
				fetchPriority={fetchPriority}
				className={`${className ?? ""} cursor-zoom-in`}
				onClick={() => setOpen(true)}
			/>
			{open && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label={alt || "Image preview"}
					className="fixed inset-0 z-100 grid place-items-center bg-black/85 p-4 backdrop-blur-sm cursor-zoom-out"
					onClick={() => setOpen(false)}
				>
					<button
						type="button"
						aria-label="Close"
						onClick={() => setOpen(false)}
						className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
					>
						×
					</button>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={src}
						alt={alt}
						className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
					/>
				</div>
			)}
		</>
	);
}
