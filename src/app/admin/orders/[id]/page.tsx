import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
	getOrder,
	updateOrder,
	parseItems,
	ORDER_STATUSES,
	STATUS_LABEL,
	type OrderStatus,
} from "@/lib/db";
import { money, SITE, isSafeImageDataUrl } from "@/lib/site";
import { statusEmail, emailConfigured, sendEmail, ownerEmail, gmailComposeLink } from "@/lib/email";
import { getSettings } from "@/lib/catalog";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { StatusPill } from "@/components/StatusPill";
import { getCoupon } from "@/lib/coupons";
import { couponLabel } from "@/lib/coupon-types";
import { createCouponAction } from "@/app/admin/coupons/actions";
import { couponWhatsAppMessage } from "@/app/admin/coupons/message";
import CopyBox from "@/app/admin/CopyBox";
import { SaveButton } from "@/app/admin/SaveButton";
import DeleteOrderButton from "../DeleteOrderButton";

export const dynamic = "force-dynamic";

/** Auto-notify the customer by email for a status (no-op until Resend is configured). */
async function notify(orderId: string, status: OrderStatus) {
	const o = await getOrder(orderId);
	if (!o || !o.email || !emailConfigured()) return;
	const settings = await getSettings();
	const { subject, text } = statusEmail({ ...o, status }, settings.emailTemplates);

	let attachments: { filename: string; content: string }[] | undefined;
	if (status === "confirmed" || status === "dispatched") {
		try {
			const items = parseItems(o.itemsJson);
			const pdfBytes = await buildInvoicePdf(o, items, settings);
			attachments = [
				{
					filename: `Invoice-${o.id}.pdf`,
					content: Buffer.from(pdfBytes).toString("base64"),
				},
			];
		} catch (err) {
			console.error(`Failed to generate invoice PDF for order ${o.id} status ${status}:`, err);
		}
	}

	await sendEmail({ to: o.email, subject, text, replyTo: ownerEmail(), attachments });
}

export default async function OrderDetail({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ coupon?: string; saved?: string; error?: string }>;
}) {
	await requireAdmin();
	const { id } = await params;
	const { coupon: madeCode, saved, error } = await searchParams;
	const [order, settings] = await Promise.all([getOrder(id), getSettings()]);
	if (!order) notFound();

	const items = parseItems(order.itemsJson);
	// Set when the owner just generated a code from this page.
	const madeCoupon = madeCode && madeCode !== "novalue" ? await getCoupon(madeCode) : null;

	async function save(formData: FormData) {
		"use server";
		try {
			const status = String(formData.get("status") || "pending_payment") as OrderStatus;
			await updateOrder(id, {
				status,
				paymentRef: String(formData.get("paymentRef") || "") || null,
				adminNote: String(formData.get("adminNote") || "") || null,
			});
			await notify(id, status);
		} catch (e) {
			console.error("Order save failed:", e);
			redirect(`/admin/orders/${id}?error=${encodeURIComponent((e as Error)?.message || "Failed to save order")}`);
		}
		redirect(`/admin/orders/${id}?saved=1`);
	}

	async function setStatus(formData: FormData) {
		"use server";
		const status = String(formData.get("status") || "") as OrderStatus;
		if (status) {
			await updateOrder(id, { status });
			await notify(id, status);
		}
		redirect(`/admin/orders/${id}`);
	}

	return (
		<div>
			<Link href="/admin/orders" className="text-[15px] font-semibold text-brand hover:underline">
				← All orders
			</Link>

			<div className="mt-2 flex flex-wrap items-center justify-between gap-3">
				<h1 className="flex items-center gap-2 text-[26px] font-extrabold text-ink">
					{order.id} <StatusPill status={order.status} />
				</h1>
				<div className="flex items-center gap-3">
					<Link
						href={`/admin/orders/${order.id}/invoice`}
						className="rounded-lg border border-line bg-white px-3.5 py-2 text-[14px] font-semibold text-ink hover:bg-row"
					>
						🧾 Invoice
					</Link>
					<DeleteOrderButton
						orderId={order.id}
						customerName={order.customerName}
						redirectAfterDelete
						variant="detail"
					/>
					<span className="text-[14px] text-muted">
						{new Date(order.createdAt).toLocaleString("en-IN")}
					</span>
				</div>
			</div>

			<div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
				{/* left: customer + items */}
				<div className="space-y-6">
					<Card title="Customer">
						<Row k="Name" v={order.customerName} />
						<Row k="Phone" v={order.phone} />
						<Row k="WhatsApp" v={order.whatsapp || order.phone} />
						{order.email && <Row k="Email" v={order.email} />}
						{order.gstNo && <Row k="GST no." v={order.gstNo} />}
						<Row k="Address" v={order.address} />
						{order.area && <Row k="Area" v={order.area} />}
						<Row k="City / State" v={`${order.city}, ${order.state}`} />
						<Row k="Pincode" v={order.pincode} />
						{order.areaMap && (
							<div className="flex gap-3 py-1 text-[15px]">
								<span className="w-24 shrink-0 text-muted">Map</span>
								<a
									href={order.areaMap}
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium text-brand hover:underline"
								>
									📍 Delivery point on Google Maps ↗
								</a>
							</div>
						)}
					</Card>

					<Card title="Payment">
						<Row k="UTR / Txn ID" v={order.utr || "—"} />
						{/* Checked again at render: rows stored before the API validated this
						    could still hold something that isn't an image. */}
						{order.screenshotData && isSafeImageDataUrl(order.screenshotData) ? (
							<div className="mt-2">
								<p className="mb-1 text-[13px] text-muted">Receipt screenshot</p>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<a href={order.screenshotData} target="_blank" rel="noopener">
									<img src={order.screenshotData} alt="payment receipt" className="max-h-72 rounded-lg border border-line" />
								</a>
							</div>
						) : (
							<p className="mt-1 text-[14px] text-muted">No screenshot uploaded.</p>
						)}
					</Card>

					<Card title={`Items (${order.itemCount})`}>
						<div className="overflow-x-auto">
							<table className="w-full text-[14.5px]">
								<thead>
									<tr className="text-left text-muted">
										<th className="py-1.5">Product</th>
										<th className="py-1.5">Qty</th>
										<th className="py-1.5 text-right">Total</th>
									</tr>
								</thead>
								<tbody>
									{items.map((it) => (
										<tr key={it.id} className="border-t border-line">
											<td className="py-1.5 text-ink">
												{it.name}
												<span className="block text-[12.5px] text-muted">{it.content}</span>
											</td>
											<td className="py-1.5 text-ink">{it.qty}</td>
											<td className="py-1.5 text-right text-ink">{it.total ? money(it.total) : "—"}</td>
										</tr>
									))}
								</tbody>
								<tfoot>
									<tr className="border-t border-line">
										<td className="py-1 text-muted" colSpan={2}>Subtotal</td>
										<td className="py-1 text-right text-ink-soft">
											{order.hasPrices ? money(order.total) : "—"}
										</td>
									</tr>
									{order.tierDiscount > 0 && (
										<tr>
											<td className="py-1 text-muted" colSpan={2}>
												Spend offer {order.tierLabel ? `· ${order.tierLabel}` : ""}
											</td>
											<td className="py-1 text-right font-semibold text-emerald-700">
												−{money(order.tierDiscount)}
											</td>
										</tr>
									)}
									{order.couponCode && (
										<tr>
											<td className="py-1 text-muted" colSpan={2}>
												Discount code {order.couponCode}
											</td>
											<td className="py-1 text-right font-semibold text-emerald-700">
												−{money(order.couponDiscount)}
											</td>
										</tr>
									)}
									{order.gst > 0 && (
										<tr>
											<td className="py-1 text-muted" colSpan={2}>GST</td>
											<td className="py-1 text-right text-ink-soft">{money(order.gst)}</td>
										</tr>
									)}
									<tr>
										<td className="py-1 text-muted" colSpan={2}>Transport</td>
										<td className="py-1 text-right text-ink-soft">{money(order.transport)}</td>
									</tr>
									<tr className="border-t border-line font-bold">
										<td className="py-2 text-ink" colSpan={2}>
											Grand total {order.hasPrices ? "" : "(prices TBC)"}
										</td>
										<td className="py-2 text-right text-brand">
											{order.hasPrices ? money(order.grandTotal || order.total + order.transport) : "—"}
										</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</Card>
				</div>

				{/* right: manage + message */}
				<div className="space-y-6">
					<Card title="Verify payment">
						{order.status === "pending_verification" ? (
							<p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13.5px] text-amber-800">
								Check the payment reference / screenshot against your bank, then approve or reject.
							</p>
						) : (
							<p className="mb-3 text-[14px] text-muted">Current: <StatusPill status={order.status} /></p>
						)}
						<div className="flex gap-2">
							<form action={setStatus} className="flex-1">
								<input type="hidden" name="status" value="verified" />
								<button className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-[15px] font-semibold text-white hover:brightness-110">
									✓ Approve
								</button>
							</form>
							<form action={setStatus} className="flex-1">
								<input type="hidden" name="status" value="rejected" />
								<button className="w-full rounded-lg border border-red-300 px-3 py-2.5 text-[15px] font-semibold text-red-600 hover:bg-red-50">
									✕ Reject
								</button>
							</form>
						</div>
						<div className="mt-3 flex flex-wrap gap-2">
							{(["confirmed", "packing", "ready", "dispatched", "delivered"] as const).map((st) => (
								<form key={st} action={setStatus}>
									<input type="hidden" name="status" value={st} />
									<button className="rounded-lg border border-line bg-white px-3 py-2 text-[13.5px] font-semibold text-ink-soft hover:bg-row">
										{STATUS_LABEL[st]}
									</button>
								</form>
							))}
						</div>
					</Card>

					<Card title="Manage order">
						<form action={save} className="space-y-3">
							<label className="block text-[14px] font-semibold text-ink">
								Status
								<select
									name="status"
									defaultValue={order.status}
									className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-brand"
								>
									{ORDER_STATUSES.map((s) => (
										<option key={s} value={s}>
											{STATUS_LABEL[s]}
										</option>
									))}
								</select>
							</label>
							<label className="block text-[14px] font-semibold text-ink">
								Payment reference number
								<input
									name="paymentRef"
									defaultValue={order.paymentRef ?? ""}
									placeholder="The UTR / transaction number from the receipt"
									className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-brand"
								/>
							</label>
							<label className="block text-[14px] font-semibold text-ink">
								Private note (only you see this)
								<textarea
									name="adminNote"
									defaultValue={order.adminNote ?? ""}
									rows={3}
									className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-brand"
								/>
							</label>
							<SaveButton
								label="Save"
								pendingLabel="Saving..."
								savedLabel="Saved ✓"
								saved={Boolean(saved)}
								error={error}
								className="w-full rounded-lg bg-brand px-4 py-3 text-[16px] font-bold text-white hover:brightness-110"
								containerClassName="w-full"
							/>
						</form>
					</Card>

					<Card title="Give this customer a coupon">
						{madeCoupon ? (
							<>
								<p className="mb-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[14px] font-semibold text-emerald-800">
									✓ {madeCoupon.code} — {couponLabel(madeCoupon)}
								</p>
								<CopyBox text={couponWhatsAppMessage(madeCoupon, SITE.name)} />
								<p className="mt-3 text-[13px] text-muted">
									Send it on WhatsApp. They type it at checkout and the amount comes off.
								</p>
							</>
						) : (
							<>
								<p className="mb-3 text-[14px] text-muted">
									Agreed an extra discount on the phone? Make a code just for{" "}
									{order.customerName.split(" ")[0] || "this customer"} — only their number
									can use it, once, within 15 days.
								</p>
								<form action={createCouponAction} className="space-y-3">
									<input type="hidden" name="fromOrder" value={order.id} />
									<input type="hidden" name="phone" value={order.phone} />
									<input type="hidden" name="customerName" value={order.customerName} />
									<input type="hidden" name="maxUses" value="1" />
									<input type="hidden" name="days" value="15" />
									<label className="block text-[14px] font-semibold text-ink">
										Take off
										<div className="mt-1 flex gap-2">
											<select
												name="kind"
												defaultValue="flat"
												className="rounded-lg border border-line bg-white px-2 py-2.5 text-[15px] text-ink outline-none focus:border-brand"
											>
												<option value="flat">₹</option>
												<option value="percent">%</option>
											</select>
											<input
												name="value"
												type="number"
												min={1}
												placeholder="2000"
												className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-brand"
											/>
										</div>
									</label>
									{/* Can't be used on an order smaller than the one being discussed. */}
									<input type="hidden" name="minOrder" value={Math.max(0, order.total)} />
									<p className="text-[13px] text-muted">
										{order.hasPrices && order.total > 0 ? (
											<>
												This order is {money(order.total)} before transport. The code will only
												work on orders of that size or bigger.
											</>
										) : (
											<>
												This order has no prices yet, so the code will work on any order size.
											</>
										)}
									</p>
									<button className="w-full rounded-lg bg-brand px-4 py-3 text-[16px] font-bold text-white hover:brightness-110">
										Make the code
									</button>
								</form>
							</>
						)}
					</Card>

					<Card title="Email the customer">
						<a
							href={`/admin/orders/${order.id}/invoice-pdf`}
							className="mb-3 block rounded-lg border border-line bg-white px-4 py-2.5 text-center text-[14.5px] font-semibold text-ink hover:bg-row"
						>
							🧾 Download invoice PDF
						</a>
						{order.email ? (
							<>
								<p className="mb-3 text-[14px] text-muted">
									Opens a Gmail draft with the status message already filled in — attach the PDF you
									just downloaded, then send.
								</p>
								<a
									href={gmailComposeLink(
										order.email,
										statusEmail(order, settings.emailTemplates).subject,
										statusEmail(order, settings.emailTemplates).text,
									)}
									target="_blank"
									rel="noopener noreferrer"
									className="block rounded-lg bg-brand px-4 py-3 text-center text-[15px] font-bold text-white hover:brightness-110"
								>
									Open in Gmail with "{STATUS_LABEL[order.status as OrderStatus]}" message
								</a>
							</>
						) : (
							<p className="mb-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13.5px] text-amber-800">
								This customer didn&apos;t give an email — call them on {order.phone}.
							</p>
						)}
						<p className="mt-3 text-[13px] text-muted">
							{emailConfigured()
								? "Emails are on — status changes send automatically, and the invoice PDF rides along on the order-received email. Use the Gmail button above only if you also want to send one by hand."
								: "Automatic emails aren't switched on yet — download the PDF above, then use the Gmail button to send it yourself."}
						</p>
					</Card>
				</div>
			</div>
		</div>
	);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
			<h2 className="mb-3 text-[15px] font-bold text-brand">{title}</h2>
			{children}
		</section>
	);
}

function Row({ k, v }: { k: string; v: string }) {
	return (
		<div className="flex gap-3 py-1 text-[15px]">
			<span className="w-24 shrink-0 text-muted">{k}</span>
			<span className="font-medium text-ink">{v}</span>
		</div>
	);
}
