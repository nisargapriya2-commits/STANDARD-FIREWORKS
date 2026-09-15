import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listCoupons, usedCounts, getCoupon } from "@/lib/coupons";
import { getSettings } from "@/lib/catalog";
import { couponLabel } from "@/lib/coupon-types";
import { money, SITE } from "@/lib/site";
import { aCard, aCardTitle, aCardSub, aLabel, aHint, aInput, aBtn, aPageTitle, aSuccess } from "@/lib/admin-ui";
import { createCouponAction, toggleCouponAction, deleteCouponAction } from "./actions";
import CopyBox from "../CopyBox";
import { couponWhatsAppMessage } from "./message";

export const dynamic = "force-dynamic";

export default async function CouponsPage({
	searchParams,
}: {
	searchParams: Promise<{ new?: string; e?: string; deleted?: string }>;
}) {
	await requireAdmin();
	const { new: newCode, e, deleted } = await searchParams;
	const [coupons, counts, settings] = await Promise.all([listCoupons(), usedCounts(), getSettings()]);
	const justMade = newCode ? await getCoupon(newCode) : null;

	return (
		<div>
			<h1 className={aPageTitle}>Discount codes</h1>
			<p className="mb-6 mt-1 text-[15px] text-muted">
				Give a customer a code while you&apos;re on the phone with them. They type it at
				checkout and the amount comes off by itself. To make one for a customer who has
				already placed an order, open that order instead — it fills everything in for you.
			</p>

			{deleted && <p className={aSuccess}>✓ Code deleted.</p>}
			{e === "novalue" && (
				<p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-800">
					Enter how much money to take off — a code worth ₹0 does nothing.
				</p>
			)}

			{justMade && (
				<div className="mb-6 rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
					<h2 className="text-[18px] font-bold text-emerald-900">
						✓ Code ready — {justMade.code}
					</h2>
					<p className="mb-3 mt-1 text-[14.5px] text-emerald-900/80">
						{couponLabel(justMade)}
						{justMade.phone ? ` · only for ${justMade.phone}` : " · anyone can use it"}
						{justMade.expiresAt
							? ` · valid till ${new Date(justMade.expiresAt).toLocaleDateString("en-IN")}`
							: ""}
					</p>
					<CopyBox text={couponWhatsAppMessage(justMade, SITE.name)} />
				</div>
			)}

			{/* ---- make a new one ---- */}
			<form action={createCouponAction} className={`mb-8 ${aCard}`}>
				<h2 className={aCardTitle}>➕ Make a new code</h2>
				<p className={aCardSub}>
					Leave the code box empty and we&apos;ll invent one for you.
				</p>

				<div className="grid gap-4 sm:grid-cols-2">
					<label className="block">
						<span className={aLabel}>What kind of discount?</span>
						<select name="kind" defaultValue="flat" className={aInput}>
							<option value="flat">Rupees off (e.g. ₹2,000 off)</option>
							<option value="percent">Percent off (e.g. 5% off)</option>
						</select>
						<span className={aHint}>Rupees off is the usual choice when you&apos;re bargaining.</span>
					</label>

					<label className="block">
						<span className={aLabel}>How much?</span>
						<input name="value" type="number" min={1} placeholder="2000" className={aInput} />
						<span className={aHint}>Rupees, or the percentage — depending on what you picked.</span>
					</label>

					<label className="block">
						<span className={aLabel}>Most it can take off (₹)</span>
						<input name="maxDiscount" type="number" min={0} defaultValue={0} className={aInput} />
						<span className={aHint}>
							Only for percent codes — a safety limit. 0 means no limit.
						</span>
					</label>

					<label className="block">
						<span className={aLabel}>Smallest order it works on (₹)</span>
						<input
							name="minOrder"
							type="number"
							min={0}
							defaultValue={settings.minOrder}
							className={aInput}
						/>
						<span className={aHint}>So a ₹2,000-off code can&apos;t be used on a tiny order.</span>
					</label>

					<label className="block">
						<span className={aLabel}>Customer&apos;s phone number</span>
						<input name="phone" placeholder="9344170018" className={aInput} />
						<span className={aHint}>
							<b>Recommended.</b> Only this number can use the code — so it&apos;s useless if it
							gets forwarded. Leave blank to let anyone use it.
						</span>
					</label>

					<label className="block">
						<span className={aLabel}>Customer&apos;s name</span>
						<input name="customerName" placeholder="For your own reference" className={aInput} />
					</label>

					<label className="block">
						<span className={aLabel}>How many times can it be used?</span>
						<input name="maxUses" type="number" min={1} defaultValue={1} className={aInput} />
					</label>

					<label className="block">
						<span className={aLabel}>Valid for how many days?</span>
						<input name="days" type="number" min={0} defaultValue={15} className={aInput} />
						<span className={aHint}>0 means it never expires.</span>
					</label>

					<label className="block sm:col-span-2">
						<span className={aLabel}>Your own code (optional)</span>
						<input name="code" placeholder="Leave empty and we'll make one" className={aInput} />
						<span className={aHint}>e.g. DEEPAVALI26 for a code you advertise to everyone.</span>
					</label>
				</div>

				<div className="mt-5">
					<button className={aBtn}>✓ Make the code</button>
				</div>
			</form>

			{/* ---- existing ---- */}
			<h2 className="mb-3 text-[19px] font-bold text-ink">
				Your codes ({coupons.length})
			</h2>
			{coupons.length === 0 ? (
				<p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-[15px] text-muted">
					No codes yet. Make one above, or open an order and use the button there.
				</p>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
					<table className="w-full min-w-[860px] border-collapse text-[15px]">
						<thead>
							<tr className="bg-row text-left text-[12.5px] font-semibold uppercase tracking-wide text-muted">
								<th className="px-3 py-3">Code</th>
								<th className="px-3 py-3">Discount</th>
								<th className="px-3 py-3">For</th>
								<th className="px-3 py-3">Used</th>
								<th className="px-3 py-3">Valid till</th>
								<th className="px-3 py-3">Status</th>
								<th className="px-3 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{coupons.map((c) => {
								const used = counts[c.code] ?? 0;
								const expired = c.expiresAt !== null && c.expiresAt < Date.now();
								const spent = used >= c.maxUses;
								return (
									<tr key={c.code} className="border-t border-line align-top hover:bg-row">
										<td className="px-3 py-3">
											<span className="font-bold text-brand">{c.code}</span>
											{c.fromOrder && (
												<Link
													href={`/admin/orders/${c.fromOrder}`}
													className="block text-[12.5px] text-muted hover:underline"
												>
													from order {c.fromOrder}
												</Link>
											)}
										</td>
										<td className="px-3 py-3 text-ink">
											{couponLabel(c)}
											{c.minOrder > 0 && (
												<span className="block text-[12.5px] text-muted">
													on orders over {money(c.minOrder)}
												</span>
											)}
										</td>
										<td className="px-3 py-3 text-ink-soft">
											{c.phone ? (
												<>
													{c.customerName || "—"}
													<span className="block text-[12.5px] text-muted">{c.phone}</span>
												</>
											) : (
												<span className="text-muted">Anyone</span>
											)}
										</td>
										<td className="px-3 py-3 text-ink">
											{used} of {c.maxUses}
										</td>
										<td className="px-3 py-3 text-ink-soft">
											{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "No limit"}
										</td>
										<td className="px-3 py-3">
											{!c.active ? (
												<Pill tone="off">Switched off</Pill>
											) : expired ? (
												<Pill tone="off">Expired</Pill>
											) : spent ? (
												<Pill tone="off">Used up</Pill>
											) : (
												<Pill tone="on">Ready</Pill>
											)}
										</td>
										<td className="px-3 py-3">
											<div className="flex flex-wrap gap-1.5">
												<form action={toggleCouponAction}>
													<input type="hidden" name="code" value={c.code} />
													<input type="hidden" name="to" value={c.active ? "off" : "on"} />
													<button className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13.5px] font-semibold text-ink-soft hover:bg-row">
														{c.active ? "Switch off" : "Switch on"}
													</button>
												</form>
												<form action={deleteCouponAction}>
													<input type="hidden" name="code" value={c.code} />
													<button className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[13.5px] font-semibold text-red-600 hover:bg-red-50">
														Delete
													</button>
												</form>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			<p className="mt-6 rounded-xl border border-line bg-white px-4 py-3 text-[14px] text-muted">
				A code is counted as used once the customer places an order with it. If you cancel or
				reject that order, the code frees up again by itself.
			</p>
		</div>
	);
}

function Pill({ tone, children }: { tone: "on" | "off"; children: React.ReactNode }) {
	return (
		<span
			className={`inline-block rounded-full px-2.5 py-1 text-[12.5px] font-bold ${
				tone === "on" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
			}`}
		>
			{children}
		</span>
	);
}
