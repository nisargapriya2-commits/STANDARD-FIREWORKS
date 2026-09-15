"use client";

/**
 * 4-step checkout (per client spec):
 *   1. Details — name / phone / email(opt) / GST no(opt) / address / state / city / area / pincode
 *      (state → city → area is a 3-level dropdown driven by the owner's settings;
 *       the chosen area carries a Google Maps link to the delivery point)
 *   2. Order created (status "Pending payment", visible in admin) → Payment page: QR + amount + Order ID
 *   3. Confirm — "I have completed payment" → enter UTR + upload receipt screenshot → "Pending verification"
 *   4. Done — thank you; admin verifies → auto-email
 *
 * ⚖️ Only a static QR — the site never learns payment happened automatically; the customer
 * supplies UTR + screenshot and the admin approves. No payment gateway.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	money,
	gstAmount,
	areasFor,
	formatAreaDisplay,
	bestTier,
	tierDiscount,
	type Settings,
} from "@/lib/site";
import { type CatProduct } from "@/lib/catalog-types";
import { useCart, selectedItems, cartTotals } from "@/lib/cart";
import DynamicUpiQr from "@/components/DynamicUpiQr";

type Step = "details" | "pay" | "confirm" | "done";

type Details = {
	name: string;
	phone: string;
	email: string;
	gstNo: string;
	whatsapp: string;
	address: string;
	city: string;
	state: string;
	area: string;
	pincode: string;
};

const EMPTY: Details = {
	name: "",
	phone: "",
	email: "",
	gstNo: "",
	whatsapp: "",
	address: "",
	city: "",
	state: "",
	area: "",
	pincode: "",
};

/** Downscale an image file to a compact JPEG data URL (keeps DB rows small). */
function fileToDataUrl(file: File, maxDim = 1000, quality = 0.7): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
				const canvas = document.createElement("canvas");
				canvas.width = Math.round(img.width * scale);
				canvas.height = Math.round(img.height * scale);
				const ctx = canvas.getContext("2d");
				if (!ctx) return reject(new Error("no canvas"));
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				resolve(canvas.toDataURL("image/jpeg", quality));
			};
			img.onerror = reject;
			img.src = reader.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export default function CheckoutFlow({
	products,
	settings,
}: {
	products: CatProduct[];
	settings: Settings;
}) {
	const { qty, ready, clear } = useCart();
	const [step, setStep] = useState<Step>("details");
	const [d, setD] = useState<Details>(EMPTY);
	const [touched, setTouched] = useState(false);
	const [orderId, setOrderId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [err, setErr] = useState("");

	// confirm step
	const [utr, setUtr] = useState("");
	const [shot, setShot] = useState<string>("");
	const [shotName, setShotName] = useState("");

	// coupon box — `applied` is only ever set from the server's answer
	const [couponInput, setCouponInput] = useState("");
	const [applied, setApplied] = useState<{ code: string; discount: number; label: string } | null>(null);
	const [couponMsg, setCouponMsg] = useState("");
	const [couponBusy, setCouponBusy] = useState(false);

	const items = useMemo(() => selectedItems(qty, products), [qty, products]);
	const totals = useMemo(() => cartTotals(qty, products), [qty, products]);
	const hasPrices = totals.priced > 0;
	const couponOff = applied?.discount ?? 0;

	const cities = d.state ? settings.serviceCities[d.state] ?? [] : [];
	// Level 3 — areas inside the chosen city. Empty list → the area step is skipped.
	const areas = areasFor(settings.serviceAreas ?? {}, d.state, d.city);
	const area = areas.find((a) => a.name === d.area || formatAreaDisplay(a, d.city) === d.area);
	const mapUrl = area?.mapUrl ?? "";
	const transport = d.state ? settings.transportFees[d.state] ?? 0 : 0;
	// The spend-more-save-more slab advertised on the home hero. Automatic — the
	// customer does nothing to earn it. Worked out from the same pre-discount
	// subtotal as the coupon so the two never compound into a surprise total.
	const tier = bestTier(totals.net, settings.discountTiers);
	const tierOff = tierDiscount(totals.net, settings.discountTiers);

	// Money order: subtotal → spend slab → coupon → GST on what's left → + transport.
	// Both discounts reduce the taxable value, so GST is charged after them; neither
	// comes off the transport fee. The site minimum is judged on the PRE-discount
	// subtotal — a slab or a code shouldn't make an order "too small".
	const taxable = Math.max(0, totals.net - tierOff - couponOff);
	const gst = gstAmount(taxable, settings.gstPct);
	const grand = taxable + gst + transport;
	const belowMin = hasPrices && totals.net < settings.minOrder;

	const errors = validate(
		d,
		cities,
		areas.flatMap((a) => [a.name, formatAreaDisplay(a, d.city)]),
	);
	const canContinue = Object.keys(errors).length === 0 && !belowMin;

	function set<K extends keyof Details>(k: K, v: string) {
		setD((prev) => ({ ...prev, [k]: v }));
	}
	function setState(v: string) {
		setD((prev) => ({ ...prev, state: v, city: "", area: "" }));
	}
	function setCity(v: string) {
		setD((prev) => ({ ...prev, city: v, area: "" }));
	}

	// A code is judged against a phone number and a subtotal. If either changes
	// after it was applied, the shown discount may no longer be the one the server
	// would grant — so drop it and make them apply again rather than show a total
	// we can't honour. (The order API re-checks regardless.)
	useEffect(() => {
		setApplied(null);
		setCouponMsg("");
	}, [d.phone, totals.net]);

	/** Ask the server whether this code is good for this customer + this subtotal. */
	async function applyCoupon() {
		const code = couponInput.trim();
		if (!code || couponBusy) return;
		setCouponBusy(true);
		setCouponMsg("");
		try {
			const res = await fetch("/api/coupons/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code, phone: d.phone, subtotal: totals.net }),
			});
			const data = (await res.json()) as {
				ok?: boolean;
				code?: string;
				discount?: number;
				label?: string;
				message?: string;
			};
			if (data.ok && data.code) {
				setApplied({ code: data.code, discount: data.discount ?? 0, label: data.label ?? "" });
				setCouponMsg("");
			} else {
				setApplied(null);
				setCouponMsg(data.message || "That code can't be used.");
			}
		} catch {
			setApplied(null);
			setCouponMsg("Could not check that code. Please try again.");
		} finally {
			setCouponBusy(false);
		}
	}

	function removeCoupon() {
		setApplied(null);
		setCouponInput("");
		setCouponMsg("");
	}

	/** Step 1 → create the order (before payment) → Step 2. */
	async function createOrder() {
		setTouched(true);
		if (!canContinue || busy) return;
		if (orderId) {
			setStep("pay");
			return;
		}
		setBusy(true);
		setErr("");
		try {
			const res = await fetch("/api/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: d.name,
					phone: d.phone,
					email: d.email,
					gstNo: d.gstNo,
					whatsapp: d.whatsapp,
					address: d.address,
					city: d.city,
					state: d.state,
					area: d.area,
					areaMap: mapUrl,
					pincode: d.pincode,
					total: totals.net,
					coupon: applied?.code ?? "",
					gst,
					transport,
					grandTotal: grand,
					hasPrices,
					items: items.map((l) => ({
						id: l.product.id,
						name: l.product.name,
						content: l.product.content,
						qty: l.qty,
						unit: l.unit,
						total: l.total,
						mrp: l.product.mrp,
						line: l.product.line,
					})),
				}),
			});
			const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string; couponError?: string };
			// The server re-judges the code. If it refuses, say why and drop it rather
			// than quietly charging a total the customer never agreed to.
			if (data.couponError) {
				setApplied(null);
				setCouponMsg(data.couponError);
				setErr("Your discount code could not be used — please check it and try again.");
				window.scrollTo({ top: 0, behavior: "smooth" });
				return;
			}
			if (!res.ok || !data.id) throw new Error();
			setOrderId(data.id);
			setStep("pay");
			window.scrollTo({ top: 0, behavior: "smooth" });
		} catch {
			setErr("Could not place the order. Please try again.");
		} finally {
			setBusy(false);
		}
	}

	async function onPickScreenshot(file: File | undefined) {
		if (!file) return;
		try {
			setShot(await fileToDataUrl(file));
			setShotName(file.name);
		} catch {
			setErr("Could not read that image.");
		}
	}

	/** Step 3 → attach UTR + screenshot → Pending verification → Step 4. */
	async function confirmPayment() {
		if (busy) return;
		if (settings.requireUtr && !utr.trim()) {
			setErr("Please enter the payment reference / UTR.");
			return;
		}
		setBusy(true);
		setErr("");
		try {
			const res = await fetch("/api/orders/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: orderId, utr: utr.trim(), screenshot: shot }),
			});
			if (!res.ok) throw new Error();
			setStep("done");
			window.scrollTo({ top: 0, behavior: "smooth" });
		} catch {
			setErr("Could not submit. Please try again.");
		} finally {
			setBusy(false);
		}
	}

	if (!ready) return <p className="py-10 text-center text-muted">Loading your list…</p>;
	if (items.length === 0 && step === "details") {
		return (
			<div className="border border-line bg-row p-8 text-center">
				<p className="text-[16px] text-ink-soft">Your list is empty.</p>
				<Link href="/products" className="mt-4 inline-block bg-brand px-5 py-2.5 text-[15px] font-semibold text-white hover:brightness-110">
					← Browse products
				</Link>
			</div>
		);
	}

	return (
		<>
			<Stepper step={step} />
			{err && <p className="mb-4 rounded border border-brand/40 bg-[#fff6f6] px-3 py-2 text-[14px] text-brand">{err}</p>}

			{step === "details" && (
				<div className="grid gap-6 md:grid-cols-[1fr_320px]">
					<div>
						<h2 className="text-lg font-semibold text-ink">Your details</h2>
						<p className="mb-4 mt-0.5 text-[14px] text-muted">
							Fields marked <span className="font-semibold text-brand">*</span> are required.
						</p>
						<div className="grid gap-4 sm:grid-cols-2">
							<Field label="Full name" required error={touched ? errors.name : undefined}>
								<input value={d.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Your name" />
							</Field>
							<Field label="Phone" required error={touched ? errors.phone : undefined}>
								<input value={d.phone} onChange={(e) => set("phone", e.target.value)} inputMode="numeric" className={inputCls} placeholder="10-digit mobile" />
							</Field>
							<Field label="Email" hint="optional" error={touched ? errors.email : undefined}>
								<input value={d.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="you@email.com" />
							</Field>
							<Field label="GST number" hint="optional, for dealers">
								<input value={d.gstNo} onChange={(e) => set("gstNo", e.target.value)} className={inputCls} placeholder="GSTIN" />
							</Field>
							<Field label="WhatsApp number" hint="if different from phone">
								<input value={d.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} inputMode="numeric" className={inputCls} placeholder="Same as phone" />
							</Field>
							<Field label="Pincode" required error={touched ? errors.pincode : undefined}>
								<input value={d.pincode} onChange={(e) => set("pincode", e.target.value)} inputMode="numeric" className={inputCls} placeholder="6-digit pincode" />
							</Field>
							<div className="sm:col-span-2">
								<Field label="Delivery address" required error={touched ? errors.address : undefined}>
									<textarea value={d.address} onChange={(e) => set("address", e.target.value)} rows={3} className={inputCls} placeholder="Door no, street, area, landmark" />
								</Field>
							</div>
							<Field label="State" required error={touched ? errors.state : undefined}>
								<select value={d.state} onChange={(e) => setState(e.target.value)} className={inputCls}>
									<option value="">Select state…</option>
									{settings.serviceStates.map((s) => (<option key={s} value={s}>{s}</option>))}
								</select>
							</Field>
							<Field label="City / Town" required hint={d.state ? "we deliver to these only" : "select state first"} error={touched ? errors.city : undefined}>
								<select value={d.city} onChange={(e) => setCity(e.target.value)} disabled={!d.state} className={`${inputCls} disabled:cursor-not-allowed disabled:bg-row disabled:text-muted`}>
									<option value="">{d.state ? "Select city…" : "Select state first"}</option>
									{cities.map((c) => (<option key={c} value={c}>{c}</option>))}
								</select>
							</Field>
							{/* Level 3 — only shown when the owner has listed areas for this city. */}
							{areas.length > 0 && (
								<div className="sm:col-span-2">
									<Field label="Area / delivery point" required hint={`inside ${d.city}`} error={touched ? errors.area : undefined}>
										<select value={d.area} onChange={(e) => set("area", e.target.value)} className={inputCls}>
											<option value="">Select area…</option>
											{areas.map((a) => {
												const display = formatAreaDisplay(a, d.city);
												return (<option key={a.name} value={display}>{display}</option>);
											})}
										</select>
									</Field>
									{d.area && (
										mapUrl ? (
											<a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-medium text-brand hover:underline">
												📍 View {area?.name || d.area} delivery point on Google Maps ↗
											</a>
										) : (
											<p className="mt-1.5 text-[14px] text-muted">We&apos;ll share the exact {area?.name || d.area} pickup point when your order is dispatched.</p>
										)
									)}
								</div>
							)}
						</div>

						{d.state && cities.length === 0 && (
							<p className="mt-2 text-[14px] text-brand">Sorry, we don&apos;t have a delivery point in {d.state} yet — please contact us.</p>
						)}
						<p className="mt-3 text-[14px] text-muted">Transport to your nearest transport office; a per-state fee is added at payment.</p>

						{/* ---- coupon ---- */}
						<div className="mt-5 border border-line bg-shell p-4">
							{applied ? (
								<div className="flex flex-wrap items-center justify-between gap-3">
									<div>
										<p className="text-[15px] font-semibold text-ink">
											🎟️ Code <span className="font-bold text-brand">{applied.code}</span> applied
										</p>
										<p className="text-[14px] text-muted">
											{applied.label} — you save {money(applied.discount)}
										</p>
									</div>
									<button
										type="button"
										onClick={removeCoupon}
										className="border border-line bg-white px-3 py-1.5 text-[14px] font-medium text-ink-soft hover:bg-row"
									>
										Remove
									</button>
								</div>
							) : (
								<>
									<label className="mb-1 block text-[14px] font-medium text-ink-soft">
										Have a discount code?
										<span className="ml-1 font-normal text-muted">(if we gave you one)</span>
									</label>
									<div className="flex flex-wrap gap-2">
										<input
											value={couponInput}
											onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													applyCoupon();
												}
											}}
											placeholder="e.g. SF-7K4Q2"
											className={`${inputCls} w-auto flex-1`}
										/>
										<button
											type="button"
											onClick={applyCoupon}
											disabled={couponBusy || !couponInput.trim()}
											className="border border-brand bg-white px-4 py-2 text-[15px] font-semibold text-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
										>
											{couponBusy ? "Checking…" : "Apply"}
										</button>
									</div>
									{couponMsg && <p className="mt-2 text-[14px] text-brand">{couponMsg}</p>}
									{!couponMsg && (
										<p className="mt-2 text-[13.5px] text-muted">
											Enter your phone number above first — codes are issued to a specific number.
										</p>
									)}
								</>
							)}
						</div>

						<div className="mt-6 flex items-center gap-3">
							<Link href="/products" className="border border-line px-4 py-2.5 text-[15px] font-medium text-ink-soft hover:bg-row">← Edit list</Link>
							<button onClick={createOrder} disabled={busy} className="bg-brand px-5 py-2.5 text-[15px] font-semibold text-white hover:brightness-110 disabled:opacity-60">
								{busy ? "Placing order…" : "Continue to Payment →"}
							</button>
						</div>
						{touched && belowMin && (
							<p className="mt-2 text-[14px] text-brand">Minimum order is {money(settings.minOrder)} — add {money(settings.minOrder - totals.net)} more.</p>
						)}
						{touched && !belowMin && Object.keys(errors).length > 0 && (
							<p className="mt-2 text-[14px] text-brand">Please fill the required fields above.</p>
						)}
					</div>

					<OrderSummary items={items} totals={totals} gst={gst} gstPct={settings.gstPct} transport={transport} state={d.state} city={d.city} area={d.area} mapUrl={mapUrl} couponCode={applied?.code ?? ""} couponOff={couponOff} tierLabel={tier?.label ?? ""} tierOff={tierOff} hasPrices={hasPrices} minOrder={settings.minOrder} />
				</div>
			)}

			{step === "pay" && (
				<div className="grid gap-6 md:grid-cols-[1fr_320px]">
					<div>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-2 border border-line bg-shell px-4 py-3">
							<div>
								<p className="text-[13px] uppercase tracking-wide text-muted">Order ID</p>
								<p className="text-lg font-bold text-ink">{orderId}</p>
							</div>
							<div className="text-right">
								<p className="text-[13px] uppercase tracking-wide text-muted">Amount to pay</p>
								<p className="text-2xl font-extrabold text-brand">{money(grand)}</p>
							</div>
						</div>

						<div className="mb-4">
							<DynamicUpiQr
								amount={grand}
								orderId={orderId}
								upiId={settings.upi}
								payeeName={settings.bankHolder}
								phone={settings.phone}
							/>
						</div>

						<div className="mb-5 border border-line bg-white p-4">
							<h3 className="mb-3 text-[16px] font-semibold text-ink">Or pay by bank transfer</h3>
							<dl className="grid grid-cols-[110px_1fr] gap-y-1.5 text-[15px]">
								<dt className="text-muted">Account name</dt><dd className="font-medium text-ink">{settings.bankHolder}</dd>
								<dt className="text-muted">Bank</dt><dd className="font-medium text-ink">{settings.bankName}{settings.bankBranch ? `, ${settings.bankBranch}` : ""}</dd>
								<dt className="text-muted">A/C number</dt><dd className="select-all font-medium text-ink">{settings.bankAccount}</dd>
								<dt className="text-muted">IFSC</dt><dd className="select-all font-medium text-ink">{settings.bankIfsc}</dd>
							</dl>
							<p className="mt-2 text-[14px] text-muted">Cash on delivery is not available.</p>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
							<button onClick={() => setStep("details")} className="border border-line px-4 py-2.5 text-[15px] font-medium text-ink-soft hover:bg-row">← Back</button>
							<button onClick={() => { setStep("confirm"); window.scrollTo({ top: 0 }); }} className="bg-brand px-5 py-3 text-[16px] font-semibold text-white hover:brightness-110">
								I have completed payment →
							</button>
						</div>
					</div>

					<OrderSummary items={items} totals={totals} gst={gst} gstPct={settings.gstPct} transport={transport} state={d.state} city={d.city} area={d.area} mapUrl={mapUrl} couponCode={applied?.code ?? ""} couponOff={couponOff} tierLabel={tier?.label ?? ""} tierOff={tierOff} hasPrices={hasPrices} minOrder={settings.minOrder} />
				</div>
			)}

			{step === "confirm" && (
				<div className="mx-auto max-w-lg">
					<h2 className="mb-1 text-lg font-semibold text-ink">Confirm your payment</h2>
					<p className="mb-5 text-[15px] text-ink-soft">Order <strong>{orderId}</strong> · {money(grand)}. Enter your payment reference and attach the receipt so we can verify it.</p>

					<Field label="Transaction ID / UTR" required={settings.requireUtr} hint="from your GPay/PhonePe/bank receipt">
						<input value={utr} onChange={(e) => setUtr(e.target.value)} className={inputCls} placeholder="e.g. 4587xxxxxxx" />
					</Field>

					<div className="mt-4">
						<span className="mb-1 block text-[14px] font-medium text-ink-soft">Payment receipt screenshot <span className="font-normal text-muted">(recommended)</span></span>
						<input type="file" accept="image/*" onChange={(e) => onPickScreenshot(e.target.files?.[0])} className="block w-full text-[14px] text-ink-soft file:mr-3 file:border file:border-line file:bg-row file:px-3 file:py-1.5 file:text-[14px]" />
						{shot && (
							<div className="mt-2 flex items-center gap-3">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={shot} alt="receipt preview" className="h-20 w-20 border border-line object-cover" />
								<span className="text-[14px] text-muted">{shotName}</span>
							</div>
						)}
					</div>

					<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
						<button onClick={() => setStep("pay")} className="border border-line px-4 py-2.5 text-[15px] font-medium text-ink-soft hover:bg-row">← Back</button>
						<button onClick={confirmPayment} disabled={busy} className="bg-brand px-5 py-3 text-[16px] font-semibold text-white hover:brightness-110 disabled:opacity-60">
							{busy ? "Submitting…" : "Submit for verification"}
						</button>
					</div>
				</div>
			)}

			{step === "done" && (
				<div className="border border-line bg-white p-8 text-center">
					<div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#e8f7ec] text-2xl">✅</div>
					<h2 className="text-xl font-bold text-ink">Payment submitted for verification</h2>
					{orderId && <p className="mt-1 text-[15px] text-muted">Order ID: <strong className="text-ink">{orderId}</strong></p>}
					<p className="mx-auto mt-2 max-w-md text-[16px] leading-6 text-ink-soft">
						Thank you! Our team will verify your payment and confirm your order shortly. We&apos;ll email you an update at each step, and call you if anything needs checking. 🎇
					</p>
					<div className="mt-6 flex flex-wrap justify-center gap-3">
						<Link href="/products" onClick={clear} className="bg-brand px-5 py-2.5 text-[15px] font-semibold text-white hover:brightness-110">Start a new list</Link>
					</div>
				</div>
			)}
		</>
	);
}

/* ---------- helpers ---------- */

const inputCls = "w-full border border-line bg-white px-3 py-2 text-[16px] text-ink focus:border-brand focus:outline-none";

function validate(d: Details, cities: string[], areas: string[]) {
	const e: Partial<Record<keyof Details, string>> = {};
	if (!d.name.trim()) e.name = "Required";
	if (d.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit number";
	if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "Invalid email";
	if (!d.address.trim()) e.address = "Required";
	if (!d.state) e.state = "Required";
	if (!d.city) e.city = "Select a city";
	else if (cities.length && !cities.includes(d.city)) e.city = "We don't deliver here";
	// Area is only required for cities where the owner actually listed areas.
	if (areas.length) {
		if (!d.area) e.area = "Select an area";
		else if (!areas.includes(d.area)) e.area = "We don't deliver here";
	}
	if (!/^\d{6}$/.test(d.pincode.trim())) e.pincode = "Enter a 6-digit pincode";
	return e;
}

function Stepper({ step }: { step: Step }) {
	const steps: { id: Step; label: string }[] = [
		{ id: "details", label: "Details" },
		{ id: "pay", label: "Payment" },
		{ id: "confirm", label: "Verify" },
	];
	const order: Step[] = ["details", "pay", "confirm", "done"];
	const activeIndex = Math.min(order.indexOf(step), 2);
	return (
		<div className="mb-6 flex items-center gap-2 text-[14px] font-semibold">
			{steps.map((s, i) => (
				<div key={s.id} className="flex items-center gap-2">
					<span className={`grid h-7 w-7 place-items-center rounded-full ${i <= activeIndex ? "bg-brand text-white" : "bg-row text-muted"}`}>{i + 1}</span>
					<span className={i <= activeIndex ? "text-ink" : "text-muted"}>{s.label}</span>
					{i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
				</div>
			))}
		</div>
	);
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
	return (
		<label className="block">
			<span className="mb-1 block text-[14px] font-medium text-ink-soft">
				{label}
				{required && <span className="text-brand"> *</span>}
				{hint && <span className="ml-1 font-normal text-muted">({hint})</span>}
			</span>
			{children}
			{error && <span className="mt-1 block text-[13px] text-brand">{error}</span>}
		</label>
	);
}

function OrderSummary({ items, totals, gst, gstPct, transport, state, city, area, mapUrl, couponCode, couponOff, tierLabel, tierOff, hasPrices, minOrder }: {
	items: ReturnType<typeof selectedItems>;
	totals: ReturnType<typeof cartTotals>;
	gst: number;
	gstPct: number;
	transport: number;
	state: string;
	city: string;
	area: string;
	mapUrl: string;
	couponCode: string;
	couponOff: number;
	tierLabel: string;
	tierOff: number;
	hasPrices: boolean;
	minOrder: number;
}) {
	const grand = Math.max(0, totals.net - tierOff - couponOff) + gst + transport;
	const belowMin = hasPrices && totals.net < minOrder;
	return (
		<aside className="h-max border border-line bg-shell p-4">
			<h3 className="mb-3 border-b border-line pb-2 text-[16px] font-semibold text-ink">Your list ({totals.items} {totals.items === 1 ? "item" : "items"})</h3>
			<ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-[13.5px]">
				{items.map((l) => (
					<li key={l.product.id} className="flex justify-between gap-2">
						<span className="text-ink-soft">{l.product.name} × {l.qty}</span>
						<span className="whitespace-nowrap font-medium text-ink">{l.product.price ? money(l.total) : "—"}</span>
					</li>
				))}
			</ul>
			<div className="mt-3 space-y-1 border-t border-line pt-3 text-[15px]">
				<Row k="Subtotal" v={hasPrices ? money(totals.net) : "TBC"} />
				{tierOff > 0 && (
					<div className="flex justify-between">
						<span className="text-muted">{tierLabel || "Spend offer"}</span>
						<span className="font-medium text-[#2f7d4a]">−{money(tierOff)}</span>
					</div>
				)}
				{couponCode && (
					<div className="flex justify-between">
						<span className="text-muted">Code {couponCode}</span>
						<span className="font-medium text-[#2f7d4a]">−{money(couponOff)}</span>
					</div>
				)}
				{gstPct > 0 && <Row k={`GST (${gstPct}%)`} v={money(gst)} />}
				<Row k="Transport" v={state ? money(transport) : "Select state"} muted={!state} />
				<div className="flex justify-between border-t border-line pt-2 font-semibold">
					<span>Grand total</span>
					<span className="text-brand">{hasPrices && state ? money(grand) : "—"}</span>
				</div>
				{belowMin && <p className="pt-1 text-[13px] text-brand">Minimum order {money(minOrder)}.</p>}
			</div>
			{area && (
				<div className="mt-3 border-t border-line pt-3 text-[13.5px]">
					<p className="text-muted">Delivery point</p>
					<p className="font-medium text-ink">{area}, {city}</p>
					{mapUrl && (
						<a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block font-medium text-brand hover:underline">
							📍 Open in Google Maps ↗
						</a>
					)}
				</div>
			)}
		</aside>
	);
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
	return (
		<div className="flex justify-between">
			<span className="text-muted">{k}</span>
			<span className={muted ? "text-muted" : "text-ink"}>{v}</span>
		</div>
	);
}
