"use client";

/**
 * Quantity + WhatsApp box for one product's own page. Reads/writes the SAME
 * cart as the full price-list table (`useCart`), so a quantity set here shows
 * up at /checkout too — this page is an extra entry point, not a separate cart.
 */

import Link from "next/link";
import { SITE, money, waLinkTo } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";
import { useCart } from "@/lib/cart";

export default function ProductOrderBox({
	id,
	name,
	content,
	price,
	whatsapp,
	soldOut,
}: {
	id: string;
	name: string;
	content: string;
	price: number;
	whatsapp: string;
	soldOut: boolean;
}) {
	const { qty, setQty } = useCart();
	const q = qty[id] ?? 0;

	function setValue(raw: string) {
		const trimmed = raw.trim();
		if (trimmed === "") {
			setQty(id, 0);
			return;
		}
		let n = Math.floor(Number(trimmed));
		if (!Number.isFinite(n) || n < 0) n = 0;
		setQty(id, n);
	}

	const waQty = q > 0 ? q : 1;
	const amount = price ? money(price * waQty) : "(price to be confirmed)";
	const message =
		`Hi ${SITE.name}, I'd like an estimate for:\n\n` +
		`• ${name}${content ? ` (${content})` : ""} × ${waQty} = ${amount}\n\n` +
		`Please confirm availability and transport. Thank you!`;

	return (
		<div className="border border-line bg-white p-5 shadow-sm">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-[13px] font-semibold uppercase tracking-wider text-muted">Quantity</p>
					<input
						type="number"
						min={0}
						step={1}
						inputMode="numeric"
						disabled={soldOut}
						aria-label={`Quantity for ${name}`}
						value={soldOut ? "" : q === 0 ? "" : q}
						placeholder={soldOut ? "—" : "0"}
						onChange={(e) => setValue(e.target.value)}
						className="mt-1 w-24 border border-line px-3 py-2 text-center text-lg font-semibold focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-row"
					/>
				</div>
				{q > 0 && price > 0 && (
					<div className="text-right">
						<p className="text-[13px] font-semibold uppercase tracking-wider text-muted">Line total</p>
						<p className="mt-1 text-lg font-bold text-brand">{money(price * q)}</p>
					</div>
				)}
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				<a
					href={waLinkTo(whatsapp, message)}
					target="_blank"
					rel="noopener"
					className="inline-flex items-center gap-1.5 border border-[#25D366] px-4 py-2.5 text-[15px] font-semibold text-[#128c4b] hover:bg-[#f0fff6]"
				>
					<WhatsAppIcon className="h-4 w-4" /> Ask on WhatsApp
				</a>
				<Link
					href="/checkout"
					className="inline-flex items-center gap-1.5 bg-brand px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:brightness-110"
				>
					Proceed to Checkout →
				</Link>
			</div>
		</div>
	);
}
