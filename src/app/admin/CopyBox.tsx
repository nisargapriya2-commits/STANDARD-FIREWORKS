"use client";

import { useState } from "react";

/**
 * The message the owner pastes into WhatsApp, with a one-tap copy.
 * He works from his phone, so "select the text by hand" is not a workflow.
 */
export default function CopyBox({ text, label = "Copy message" }: { text: string; label?: string }) {
	const [done, setDone] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// Clipboard API needs a secure context; fall back to the old way.
			const ta = document.createElement("textarea");
			ta.value = text;
			ta.style.position = "fixed";
			ta.style.opacity = "0";
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
		}
		setDone(true);
		setTimeout(() => setDone(false), 2000);
	}

	return (
		<div className="space-y-2">
			<pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-white p-3 text-[14px] leading-6 text-ink">
				{text}
			</pre>
			<button
				type="button"
				onClick={copy}
				className="rounded-lg bg-brand px-4 py-2 text-[15px] font-semibold text-white hover:brightness-110"
			>
				{done ? "✓ Copied — now paste it in WhatsApp" : label}
			</button>
		</div>
	);
}
