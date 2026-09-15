"use client";

/**
 * Error boundary for the ADMIN panel.
 *
 * Separate from the public one because the audience is different: the shop owner
 * needs to know whether it is safe to retry and what to tell his developer, not a
 * reassuring apology. Most failures here are D1 being briefly unreachable, and the
 * honest answer is "nothing was saved, press retry".
 *
 * Shows the digest prominently — it is the only handle that ties this screen to a
 * stack trace in `npx wrangler tail`.
 */

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[admin error]", { digest: error.digest, message: error.message });
	}, [error]);

	return (
		<div className="mx-auto max-w-[560px] rounded-2xl border border-red-200 bg-white p-7 text-center shadow-sm">
			<p className="text-[38px] leading-none">⚠️</p>
			<h1 className="mt-3 text-[22px] font-extrabold text-ink">That didn&apos;t work</h1>
			<p className="mt-2 text-[15.5px] leading-7 text-muted">
				Something went wrong loading this page. <strong>Nothing was saved or changed</strong>,
				so it is safe to try again. If it keeps happening, the database may be briefly
				unavailable — wait a minute and retry.
			</p>

			<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
				<button
					onClick={reset}
					className="rounded-lg bg-brand px-5 py-2.5 text-[15.5px] font-bold text-white hover:brightness-110"
				>
					Try again
				</button>
				<Link
					href="/admin"
					className="rounded-lg border border-line bg-white px-5 py-2.5 text-[15.5px] font-semibold text-ink hover:bg-row"
				>
					Back to dashboard
				</Link>
			</div>

			<div className="mt-7 border-t border-line pt-4 text-left">
				<p className="text-[13.5px] font-semibold text-ink">If you need to report this:</p>
				<p className="mt-1 text-[13.5px] leading-6 text-muted">
					Send your developer the reference below and roughly what you were doing.
				</p>
				<code className="mt-2 block break-all rounded-lg bg-row px-3 py-2 text-[13px] text-ink-soft">
					{error.digest || error.message || "no reference available"}
				</code>
			</div>
		</div>
	);
}
