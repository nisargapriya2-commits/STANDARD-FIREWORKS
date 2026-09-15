import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrder, parseItems, STATUS_LABEL, type OrderStatus } from "@/lib/db";
import { getSettings } from "@/lib/catalog";
import { money, SITE } from "@/lib/site";
import { isEliteItem } from "@/lib/invoice-pdf";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
	await requireAdmin();
	const { id } = await params;
	const [order, settings] = await Promise.all([getOrder(id), getSettings()]);
	if (!order) notFound();

	const items = parseItems(order.itemsJson);
	const standardItems = items.filter((it) => !isEliteItem(it));
	const eliteItems = items.filter((it) => isEliteItem(it));
	let itemCounter = 1;

	const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
	const transport = order.transport || 0;
	const grandTotal = order.grandTotal || order.total + transport;

	return (
		<div>
			<div className="print:hidden mb-5 flex flex-wrap items-center justify-between gap-3">
				<Link href={`/admin/orders/${order.id}`} className="text-[15px] font-semibold text-brand hover:underline">
					← Back to order
				</Link>
				<div className="flex gap-2">
					<a
						href={`/admin/orders/${order.id}/invoice-pdf`}
						className="rounded-lg border border-line bg-white px-5 py-2.5 text-[15px] font-semibold text-ink hover:bg-row"
					>
						⬇️ Download PDF
					</a>
					<PrintButton />
				</div>
			</div>

			{!order.hasPrices && (
				<p className="print:hidden mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13.5px] text-amber-800">
					This order has no confirmed prices yet — the invoice below will show &ldquo;TBC&rdquo;
					until you set them.
				</p>
			)}

			{/* Printable sheet */}
			<div className="mx-auto max-w-[800px] rounded-2xl border border-line bg-white p-8 text-[14px] text-ink shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
				<div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4">
					<div>
						<h1 className="text-[22px] font-extrabold text-ink">{SITE.name}</h1>
						<p className="text-[13px] text-muted">{settings.legalName || "Murugan Traders"}</p>
						<p className="mt-1 text-[13px] text-ink-soft">Sivakasi, Tamil Nadu</p>
						<p className="text-[13px] text-ink-soft">
							{settings.phone} {settings.email ? `· ${settings.email}` : ""}
						</p>
						{settings.gstNumber && <p className="text-[13px] text-ink-soft">GSTIN: {settings.gstNumber}</p>}
						{settings.licence && <p className="text-[13px] text-ink-soft">Explosives licence: {settings.licence}</p>}
					</div>
					<div className="text-right">
						<h2 className="text-[20px] font-extrabold uppercase tracking-wide text-ink">
							Invoice
						</h2>
						<p className="mt-1 text-[13px] text-ink-soft">
							Invoice no: <b className="text-ink">{order.id}</b>
						</p>
						<p className="text-[13px] text-ink-soft">Date: {date}</p>
						<p className="text-[13px] text-ink-soft">
							Status: <b className="text-ink">{STATUS_LABEL[order.status as OrderStatus] || order.status}</b>
						</p>
					</div>
				</div>

				<div className="mt-4 grid gap-4 sm:grid-cols-2">
					<div>
						<h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide text-muted">Bill to</h3>
						<p className="font-semibold text-ink">{order.customerName}</p>
						<p className="text-ink-soft">{order.phone}</p>
						<p className="text-ink-soft">{order.address}</p>
						<p className="text-ink-soft">
							{order.area ? `${order.area}, ` : ""}
							{order.city}, {order.state} {order.pincode}
						</p>
						{order.email && <p className="font-bold text-ink">{order.email}</p>}
						{order.gstNo && <p className="text-ink-soft">GSTIN: {order.gstNo}</p>}
					</div>
				</div>

				<table className="mt-5 w-full border-collapse text-[13.5px]">
					<thead>
						<tr className="border-b-2 border-ink text-left font-bold">
							<th className="py-1.5 pr-2">#</th>
							<th className="py-1.5 pr-2">Item</th>
							<th className="py-1.5 pr-2 text-right">Qty</th>
							<th className="py-1.5 pr-2 text-right">Rate</th>
							<th className="py-1.5 text-right">Amount</th>
						</tr>
					</thead>
					<tbody>
						{standardItems.length > 0 && (
							<>
								<tr className="border-y border-ink bg-gray-100">
									<td colSpan={5} className="px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-ink">
										STANDARD
									</td>
								</tr>
								{standardItems.map((it) => {
									const num = itemCounter++;
									return (
										<tr key={it.id} className="border-b border-line">
											<td className="py-1.5 pr-2 text-ink-soft">{num}</td>
											<td className="py-1.5 pr-2">
												{it.name}
												{it.content && <span className="block text-[12px] text-muted">{it.content}</span>}
											</td>
											<td className="py-1.5 pr-2 text-right">{it.qty}</td>
											<td className="py-1.5 pr-2 text-right">{it.unit ? money(it.unit) : "—"}</td>
											<td className="py-1.5 text-right">{it.total ? money(it.total) : "—"}</td>
										</tr>
									);
								})}
							</>
						)}
						{eliteItems.length > 0 && (
							<>
								<tr className="border-y border-ink bg-gray-100">
									<td colSpan={5} className="px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-ink">
										ELITE BRAND
									</td>
								</tr>
								{eliteItems.map((it) => {
									const num = itemCounter++;
									return (
										<tr key={it.id} className="border-b border-line">
											<td className="py-1.5 pr-2 text-ink-soft">{num}</td>
											<td className="py-1.5 pr-2">
												{it.name}
												{it.content && <span className="block text-[12px] text-muted">{it.content}</span>}
											</td>
											<td className="py-1.5 pr-2 text-right">{it.qty}</td>
											<td className="py-1.5 pr-2 text-right">{it.unit ? money(it.unit) : "—"}</td>
											<td className="py-1.5 text-right">{it.total ? money(it.total) : "—"}</td>
										</tr>
									);
								})}
							</>
						)}
					</tbody>
				</table>

				<div className="mt-4 flex justify-end">
					<table className="w-full max-w-[300px] text-[13.5px]">
						<tbody>
							<tr>
								<td className="py-1 text-muted">Subtotal</td>
								<td className="py-1 text-right text-ink">{order.hasPrices ? money(order.total) : "TBC"}</td>
							</tr>
							{order.tierDiscount > 0 && (
								<tr>
									<td className="py-1 text-muted">Spend offer{order.tierLabel ? ` (${order.tierLabel})` : ""}</td>
									<td className="py-1 text-right text-emerald-700">−{money(order.tierDiscount)}</td>
								</tr>
							)}
							{order.couponCode && (
								<tr>
									<td className="py-1 text-muted">Discount code {order.couponCode}</td>
									<td className="py-1 text-right text-emerald-700">−{money(order.couponDiscount)}</td>
								</tr>
							)}
							{order.gst > 0 && (
								<tr>
									<td className="py-1 text-muted">GST</td>
									<td className="py-1 text-right text-ink">{money(order.gst)}</td>
								</tr>
							)}
							<tr>
								<td className="py-1 text-muted">Transport</td>
								<td className="py-1 text-right text-ink">{money(transport)}</td>
							</tr>
							<tr className="border-t-2 border-ink font-bold">
								<td className="py-2 text-ink">Grand total</td>
								<td className="py-2 text-right text-brand">{order.hasPrices ? money(grandTotal) : "TBC"}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div className="mt-6 grid gap-4 border-t border-line pt-4 text-[12.5px] sm:grid-cols-2">
					<div className="flex items-start gap-4">
						{order.hasPrices && grandTotal > 0 && (
							<div className="shrink-0 text-center">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={`/api/upi-qr?amount=${grandTotal}&orderId=${order.id}`}
									alt={`UPI QR code for ${money(grandTotal)}`}
									className="h-24 w-24 rounded border border-line bg-white p-1"
								/>
								<span className="mt-1 block text-[10.5px] font-semibold text-emerald-800">
									Scan to pay {money(grandTotal)}
								</span>
							</div>
						)}
						<div>
							<h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide text-muted">Payment</h3>
							<p className="text-ink-soft">UTR / reference: {order.paymentRef || order.utr || "—"}</p>
							{settings.upi && <p className="text-ink-soft">UPI: {settings.upi}</p>}
							{settings.bankAccount && (
								<p className="text-ink-soft">
									{settings.bankHolder} · {settings.bankName} · A/c {settings.bankAccount} · IFSC{" "}
									{settings.bankIfsc}
								</p>
							)}
						</div>
					</div>
					<div className="sm:text-right">
						<p className="text-muted">This is a computer-generated invoice.</p>
						<p className="mt-1 font-semibold text-ink">Thank you for your order — {SITE.name}.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
