/**
 * 404 page. Reached by mistyped URLs and — more importantly — by old links once
 * the catalogue changes, since category anchors are part of the URL.
 *
 * Server component on purpose: no interactivity needed, and it must stay cheap
 * because bots hit 404s far more often than customers do.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Page not found",
	robots: { index: false, follow: true },
};

export default function NotFound() {
	return (
		<section className="mx-auto max-w-[640px] px-4 py-16 text-center">
			<p className="text-[44px] leading-none">🎆</p>
			<h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
				That page isn&apos;t here
			</h1>
			<p className="mx-auto mt-3 max-w-md text-[16px] leading-7 text-muted">
				The link may be old, or the page may have moved. Everything we sell is on the
				price list.
			</p>
			<div className="mt-7 flex flex-wrap items-center justify-center gap-3">
				<Link href="/products" className="btn-yellow">
					See the price list
				</Link>
				<Link href="/" className="btn-red">
					Go to the home page
				</Link>
			</div>
			<p className="mt-8 text-[15px] text-muted">
				Looking for something specific?{" "}
				<Link href="/contact" className="font-semibold text-brand hover:underline">
					Contact us
				</Link>
				.
			</p>
		</section>
	);
}
