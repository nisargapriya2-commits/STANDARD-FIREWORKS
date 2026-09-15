"use client";

/**
 * Route-level error boundary for every PUBLIC page.
 *
 * Without this file Next renders its own bare "Application error: a client-side
 * exception has occurred" screen — no branding, no phone number, no way forward.
 * A customer who hits that during the Deepavali rush simply leaves.
 *
 * ⚠️ Deliberately depends on NOTHING but `SITE` (a code-level constant). The most
 * likely reason we are here at all is that D1 is unreachable, so anything that
 * reads settings/catalogue from the database would throw again and produce an
 * infinite error loop. Phone and WhatsApp are baked into the bundle.
 */

import { useEffect } from "react";
import Link from "next/link";
import { SITE, waLink, telLinkTo } from "@/lib/site";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Goes to the Worker log — `npx wrangler tail` shows it live. In production
		// Next replaces the message with a digest, so log both: the digest is the
		// only thing that ties this screen to the real stack trace in the logs.
		console.error("[page error]", { digest: error.digest, message: error.message });
	}, [error]);

	return (
		<section className="mx-auto max-w-[640px] px-4 py-16 text-center">
			<p className="text-[44px] leading-none">🧨</p>
			<h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
				Something went wrong at our end
			</h1>
			<p className="mx-auto mt-3 max-w-md text-[16px] leading-7 text-muted">
				This is our fault, not yours — and your order list is still saved on this device.
				Try again, or just call us and we&apos;ll take the order over the phone.
			</p>

			<div className="mt-7 flex flex-wrap items-center justify-center gap-3">
				<button onClick={reset} className="btn-yellow">
					Try again
				</button>
				<Link href="/products" className="btn-red">
					Back to the price list
				</Link>
			</div>

			<div className="mt-8 border-t border-line pt-6">
				<p className="text-[15px] text-muted">Or reach us directly —</p>
				<div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[16px] font-semibold">
					<a href={telLinkTo(SITE.phone)} className="text-brand hover:underline">
						📞 {SITE.phone}
					</a>
					<a
						href={waLink("Hi, the website showed an error. Can you help me with my order?")}
						target="_blank"
						rel="noopener"
						className="text-[#1c8c4b] hover:underline"
					>
						💬 WhatsApp us
					</a>
				</div>
			</div>

			{error.digest && (
				<p className="mt-8 text-[12px] text-muted">
					If you contact us, quoting this code helps: <code>{error.digest}</code>
				</p>
			)}
		</section>
	);
}
