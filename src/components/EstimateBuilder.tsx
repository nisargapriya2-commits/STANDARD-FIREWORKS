"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SITE, money, waLinkTo, type Settings } from "@/lib/site";
import {
	LINES,
	categoriesByLine,
	type CatCategory,
	type CatProduct,
	type LineId,
} from "@/lib/catalog-types";
import { CategoryIcon, WhatsAppIcon } from "@/components/icons";
import Zoomable from "@/components/Zoomable";
import { useCart } from "@/lib/cart";

export default function EstimateBuilder({
	categories,
	products,
	settings,
}: {
	categories: CatCategory[];
	products: CatProduct[];
	settings: Settings;
}) {
	const { qty, setQty, clear } = useCart();
	const [line, setLine] = useState<LineId>("standard");
	const [tab, setTab] = useState<string>("all");

	// Switching product line resets the category filter but KEEPS the cart —
	// quantities are keyed by product id, so both lines feed one checkout.
	function switchLine(next: LineId) {
		setLine(next);
		setTab("all");
	}

	const totals = useMemo(() => {
		let items = 0;
		let list = 0;
		let net = 0;
		for (const p of products) {
			const q = qty[p.id] ?? 0;
			if (!q) continue;
			items += q;
			list += p.mrp * q;
			net += p.price * q;
		}
		return { items, list, net, save: list - net };
	}, [qty, products]);

	const message = useMemo(() => {
		const lines = products
			.filter((p) => (qty[p.id] ?? 0) > 0)
			.map((p) => {
				const q = qty[p.id];
				const amount = p.price ? money(p.price * q) : "(price to be confirmed)";
				return `• ${p.name} (${p.content}) × ${q} = ${amount}`;
			});
		if (!lines.length) {
			return `Hi ${SITE.name}, please send me this year's price list.`;
		}
		return (
			`Hi ${SITE.name}, I'd like an estimate for:\n\n` +
			lines.join("\n") +
			`\n\n*Total: ${money(totals.net)}*\n\n` +
			`Please confirm availability and transport. Thank you!`
		);
	}, [qty, totals.net, products]);

	/** Normalise the box so it can never disagree with the total. */
	function setValue(id: string, raw: string) {
		const trimmed = raw.trim();
		if (trimmed === "") {
			setQty(id, 0);
			return;
		}
		let n = Math.floor(Number(trimmed));
		if (!Number.isFinite(n) || n < 0) n = 0;
		setQty(id, n);
	}

	const belowMin = totals.net > 0 && totals.net < settings.minOrder;
	const inLine = categoriesByLine(categories, line);
	const shown = tab === "all" ? inLine : inLine.filter((c) => c.id === tab);

	// Count how many picked items belong to each line (for the toggle badges).
	const lineCounts = useMemo(() => {
		const c: Record<string, number> = {};
		for (const p of products) if ((qty[p.id] ?? 0) > 0) c[p.line] = (c[p.line] ?? 0) + 1;
		return c;
	}, [qty, products]);

	return (
		<>
			{/* ---- BIG product-line header bar (Standard | Elite) ---- */}
			<div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
				{LINES.map((l) => {
					const active = line === l.id;
					const picked = lineCounts[l.id] ?? 0;
					return (
						<button
							key={l.id}
							onClick={() => switchLine(l.id)}
							aria-pressed={active}
							className={`relative flex flex-col items-center justify-center border-2 px-4 py-5 text-center transition-colors sm:py-6 ${
								active
									? "border-brand bg-brand text-white shadow-md"
									: "border-line bg-white text-ink hover:border-brand/50 hover:bg-row"
							}`}
						>
							<span className="text-xl font-extrabold tracking-tight sm:text-2xl">
								{l.name}
							</span>
							<span
								className={`mt-0.5 text-[14px] font-medium ${
									active ? "text-white/85" : "text-muted"
								}`}
							>
								{l.sub}
							</span>
							{picked > 0 && (
								<span
									className={`absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[13px] font-bold ${
										active ? "bg-white text-brand" : "bg-brand text-white"
									}`}
									title={`${picked} item${picked > 1 ? "s" : ""} selected in this range`}
								>
									{picked}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* ---- sticky totals (spans BOTH lines — one shared checkout) ---- */}
			<div className="sticky top-11 z-40 mb-4 border border-line bg-white shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
					<div className="flex flex-wrap gap-x-6 gap-y-2">
						<Stat label="Items" value={String(totals.items)} />
						<Stat label="List price" value={money(totals.list)} strike />
						<Stat label="Your price" value={money(totals.net)} accent />
						<Stat label="You save" value={money(totals.save)} green />
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={clear}
							disabled={totals.items === 0}
							className="border border-line px-3 py-2 text-[15px] font-medium text-ink-soft hover:bg-row disabled:cursor-not-allowed disabled:opacity-40"
						>
							Clear
						</button>
						<a
							href={waLinkTo(settings.whatsapp, message)}
							target="_blank"
							rel="noopener"
							className="inline-flex items-center gap-1.5 border border-[#25D366] px-3 py-2 text-[15px] font-semibold text-[#128c4b] hover:bg-[#f0fff6]"
						>
							<WhatsAppIcon className="h-4 w-4" /> Ask on WhatsApp
						</a>
						{totals.items > 0 ? (
							<Link
								href="/checkout"
								className="inline-flex items-center gap-1.5 bg-brand px-5 py-2 text-[15px] font-semibold text-white shadow-sm hover:brightness-110"
							>
								Proceed to Checkout →
							</Link>
						) : (
							<span
								aria-disabled
								className="inline-flex cursor-not-allowed items-center gap-1.5 bg-brand/40 px-5 py-2 text-[15px] font-semibold text-white"
							>
								Proceed to Checkout →
							</span>
						)}
					</div>
				</div>
				{belowMin ? (
					<p className="border-t border-line bg-[#fff6f6] px-4 py-2 text-[15px] text-brand">
						⚠️ Minimum order is {money(settings.minOrder)} — add{" "}
						{money(settings.minOrder - totals.net)} more to send your list.
					</p>
				) : (
					<p className="border-t border-line bg-row px-4 py-2 text-[15px] text-muted">
						Minimum order {money(settings.minOrder)}.
					</p>
				)}
			</div>

			{/* ---- category tabs (within the selected line) ---- */}
			<div className="mb-6 flex gap-2 overflow-x-auto pb-2">
				{[{ id: "all", name: "All items" }, ...inLine].map((c) => (
					<button
						key={c.id}
						onClick={() => setTab(c.id)}
						className={`whitespace-nowrap border px-3 py-1.5 text-[15px] font-medium transition-colors ${
							tab === c.id
								? "border-brand bg-brand text-white"
								: "border-line bg-white text-ink-soft hover:bg-row"
						}`}
					>
						<span className="inline-flex items-center gap-1.5">
							<CategoryIcon id={c.id} className="h-4 w-4" />
							{c.name}
						</span>
					</button>
				))}
			</div>

			{/* ---- tables ---- */}
			{shown.map((c) => {
				const items = products.filter((p) => p.categoryId === c.id && p.active);
				if (!items.length) return null;
				return (
					<section key={c.id} id={c.id} className="mb-10 scroll-mt-28">
						<h3 className="mb-3 flex items-center gap-2.5 border-b-2 border-brand pb-2 text-lg font-semibold text-ink">
							{c.image ? (
								<Zoomable
									src={c.image}
									alt={c.name}
									loading="lazy"
									className="h-9 w-9 rounded border border-line object-cover"
								/>
							) : (
								<CategoryIcon id={c.id} className="h-5 w-5 text-brand" />
							)}
							{c.name}
						</h3>
						<div className="overflow-x-auto border border-line">
							<table className="w-full min-w-190 table-fixed border-collapse text-[16px]">
								{/* Fixed widths so every category table lines up identically. */}
								<colgroup>
									<col className="w-auto" />
									<col className="w-37.5" />
									<col className="w-27.5" />
									<col className="w-27.5" />
									<col className="w-24" />
									<col className="w-27.5" />
								</colgroup>
								<thead>
									<tr className="bg-shell text-left text-[14px] uppercase tracking-wide text-ink-soft">
										<th className="px-3 py-2.5 font-semibold">Product</th>
										<th className="px-3 py-2.5 font-semibold">Content</th>
										<th className="px-3 py-2.5 font-semibold">List price</th>
										<th className="px-3 py-2.5 font-semibold">Your price</th>
										<th className="px-3 py-2.5 font-semibold">Qty</th>
										<th className="px-3 py-2.5 font-semibold">Total</th>
									</tr>
								</thead>
								<tbody>
									{items.map((p, i) => {
										const q = qty[p.id] ?? 0;
										const soldOut = p.stock === 0;
										return (
											<tr key={p.id} className={i % 2 ? "bg-row-alt" : "bg-white"}>
												<td className="px-3 py-2.5">
													<div className="flex items-center gap-2.5">
														{/* The product's own photo, else its category photo, else the drawn icon. */}
														{p.image || c.image ? (
															<Zoomable
																src={p.image || c.image}
																alt={p.name}
																loading="lazy"
																decoding="async"
																className="h-10 w-10 flex-none rounded border border-line bg-white object-cover"
															/>
														) : (
															<span className="grid h-10 w-10 flex-none place-items-center rounded border border-line bg-linear-to-br from-[#fff7e6] to-[#fdeccb]">
																<CategoryIcon id={c.id} className="h-6 w-6 text-brand" />
															</span>
														)}
														<span>
															<Link
																href={`/products/${p.id}`}
																className="block font-medium text-ink hover:text-brand hover:underline"
															>
																{p.name}
																{soldOut && (
																	<span className="ml-1.5 rounded-sm bg-[#fdecec] px-1.5 py-0.5 text-[12px] font-semibold text-brand">
																		SOLD OUT
																	</span>
																)}
															</Link>
														</span>
													</div>
												</td>
												<td className="px-3 py-2.5 text-[15px] text-ink-soft">
													{p.content || "—"}
												</td>
												<td className="px-3 py-2.5 text-muted line-through">
													{p.mrp ? money(p.mrp) : "—"}
												</td>
												<td className="px-3 py-2.5 font-semibold text-brand">
													{p.price ? money(p.price) : "—"}
												</td>
												<td className="px-3 py-2.5">
													<input
														type="number"
														min={0}
														step={1}
														inputMode="numeric"
														disabled={soldOut}
														aria-label={`Quantity for ${p.name}`}
														value={soldOut ? "" : q === 0 ? "" : q}
														placeholder={soldOut ? "—" : "0"}
														onChange={(e) => setValue(p.id, e.target.value)}
														className="w-17.5 border border-line px-2 py-1.5 text-center font-medium focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-row"
													/>
												</td>
												<td
													className={`px-3 py-2.5 font-semibold ${
														q > 0 ? "text-ink" : "text-muted"
													}`}
												>
													{p.price ? money(p.price * q) : "—"}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</section>
				);
			})}
		</>
	);
}

function Stat({
	label,
	value,
	strike,
	accent,
	green,
}: {
	label: string;
	value: string;
	strike?: boolean;
	accent?: boolean;
	green?: boolean;
}) {
	return (
		<div>
			<p className="text-[13px] font-semibold uppercase tracking-wider text-muted">{label}</p>
			<p
				className={`text-lg font-bold ${
					strike ? "text-muted line-through" : accent ? "text-brand" : green ? "text-[#1a7f37]" : "text-ink"
				}`}
			>
				{value}
			</p>
		</div>
	);
}
