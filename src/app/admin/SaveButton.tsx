"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export interface SaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	label?: string;
	pendingLabel?: string;
	savedLabel?: string;
	saved?: boolean;
	error?: string | null;
	showErrorInline?: boolean;
	containerClassName?: string;
}

export function SaveButton({
	label = "Save",
	pendingLabel = "Saving...",
	savedLabel = "Saved ✓",
	saved = false,
	error = null,
	showErrorInline = true,
	className = "",
	containerClassName = "",
	disabled,
	...props
}: SaveButtonProps) {
	const { pending } = useFormStatus();
	const [recentSuccess, setRecentSuccess] = useState(false);
	const wasPending = useRef(false);

	useEffect(() => {
		if (wasPending.current && !pending && !error) {
			setRecentSuccess(true);
			const timer = setTimeout(() => {
				setRecentSuccess(false);
			}, 2500);
			return () => clearTimeout(timer);
		}
		wasPending.current = pending;
	}, [pending, error]);

	const isSaved = saved || recentSuccess;

	let text = label;
	if (pending) {
		text = pendingLabel;
	} else if (isSaved) {
		text = savedLabel;
	}

	const buttonStateClass = pending
		? "opacity-75 cursor-not-allowed"
		: isSaved
			? "!bg-emerald-600 !border-emerald-600 !text-white"
			: "";

	return (
		<div className={`inline-flex flex-col items-start gap-1 ${containerClassName}`}>
			<button
				type="submit"
				disabled={pending || disabled}
				className={`${className} ${buttonStateClass} transition-all duration-150 inline-flex items-center justify-center gap-1.5`}
				{...props}
			>
				{pending && (
					<svg
						className="h-4 w-4 animate-spin text-current"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				)}
				{text}
			</button>
			{showErrorInline && error && (
				<p className="text-[13px] font-medium text-red-600">
					✕ {error}
				</p>
			)}
		</div>
	);
}
