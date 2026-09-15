"use client";

import { useEffect } from "react";

/**
 * Accessible, reusable popup. Closes on Escape and on backdrop click, locks
 * body scroll while open, and animates in with the shared .modal-pop language.
 * Presentational only — the caller owns the `open`/`onClose` state.
 */
export default function Modal({
	open,
	onClose,
	children,
	labelledBy,
	maxWidth = "max-w-lg",
}: {
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
	labelledBy?: string;
	maxWidth?: string;
}) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={onClose}
			role="dialog"
			aria-modal="true"
			aria-labelledby={labelledBy}
		>
			<div
				className={`modal-pop relative w-full ${maxWidth}`}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					onClick={onClose}
					aria-label="Close"
					className="absolute -right-3 -top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white text-xl font-bold text-ink shadow-lg transition-transform hover:scale-110"
				>
					×
				</button>
				{children}
			</div>
		</div>
	);
}
