"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Modal from "@/components/Modal";
import Fireworks from "@/components/Fireworks";
import { SparkBurst } from "@/components/icons";
import { type PublicSite, money } from "@/lib/site";

/**
 * Festive discount popup, shown a short beat after load so it doesn't fight the hero.
 *
 * It lives in the root layout, so without this allowlist it fired on EVERY page —
 * including two places it actively hurts:
 *   • /checkout — a 50%-off popup thrown over a customer mid-way through typing
 *     their delivery address is a good way to lose the order.
 *   • the error and 404 pages — the popup covered the message telling the customer
 *     what had gone wrong and how to phone us.
 * Matching a known marketing route (rather than excluding a blocklist) handles both,
 * because a 404 or a crashed route never matches anything here.
 */
const POPUP_ROUTES = ["/", "/about", "/faq", "/contact"];

export default function WelcomePopup({ site }: { site: PublicSite }) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();
	const allowed = POPUP_ROUTES.includes(pathname);

	useEffect(() => {
		if (!allowed) return;
		const t = setTimeout(() => setOpen(true), 1400);
		return () => clearTimeout(t);
	}, [allowed]);

	const close = () => setOpen(false);

	return (
		<Modal open={open} onClose={close} labelledBy="welcome-title" maxWidth="max-w-md">
			<div className="night-bg relative overflow-hidden rounded-2xl border border-yellow/40 text-center text-white shadow-2xl">
				<Fireworks />
				<div className="relative z-10 px-6 py-9">
					<p className="text-[15px] font-semibold tracking-[0.3em] text-yellow">
						✦ DEEPAVALI 2026 ✦
					</p>
					<h2
						id="welcome-title"
						className="mt-2 text-5xl font-black leading-none"
					>
						<span className="gold-text">FLAT {site.discountPct}%</span>
						<span className="mt-1 block text-2xl font-extrabold text-white">
							OFF THE PRICE LIST
						</span>
					</h2>
					<p className="mx-auto mt-4 max-w-xs text-[15.5px] leading-6 text-white/85">
						Real Sivakasi crackers at wholesale rate — booking is open. Minimum order{" "}
						{money(site.minOrder)}.
					</p>

					{/*
						One way out only: the price list. The popup used to offer "Enquire on
						WhatsApp" beside it, which sent people into a chat before they had seen a
						single rate — and then the shop has to quote by hand, which is the work
						the site exists to remove. Enquiry links still live on the price list and
						all over the contact page for anyone who wants one.
					*/}
					<div className="mt-6 flex flex-col gap-3">
						<Link
							href="/products"
							onClick={close}
							className="btn-yellow shimmer w-full justify-center py-3 text-base"
						>
							<SparkBurst className="h-4 w-4" /> See the price list
						</Link>
					</div>

					<button
						onClick={close}
						className="mt-4 text-[13px] text-white/50 underline underline-offset-2 hover:text-white/80"
					>
						Maybe later
					</button>
				</div>
			</div>
		</Modal>
	);
}
