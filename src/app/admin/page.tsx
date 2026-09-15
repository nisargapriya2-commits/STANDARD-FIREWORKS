import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders, statusCounts, PROCESSING_STATUSES } from "@/lib/db";
import { money } from "@/lib/site";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
	await requireAdmin();
	const orders = await listOrders(300);
	const counts = statusCounts(orders);
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	const todayMs = startOfToday.getTime();

	const today = orders.filter((o) => o.createdAt >= todayMs).length;
	const processing = PROCESSING_STATUSES.reduce((n, s) => n + (counts[s] ?? 0), 0);
	const cancelled = (counts.cancelled ?? 0) + (counts.rejected ?? 0);
	const revenue = orders
		.filter((o) => ["verified", ...PROCESSING_STATUSES, "delivered"].includes(o.status) && o.hasPrices)
		.reduce((s, o) => s + (o.grandTotal || o.total), 0);
	const recent = orders.slice(0, 6);

	return (
		<div>
			<h1 className="text-[26px] font-extrabold text-ink">Welcome back!</h1>
			<p className="mb-6 mt-1 text-[15px] text-muted">
				Here&apos;s what&apos;s happening in your shop today.
			</p>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
				<Tile label="Today's orders" value={String(today)} highlight />
				<Tile label="Waiting to pay" value={String(counts.pending_payment ?? 0)} />
				<Tile label="To check" value={String(counts.pending_verification ?? 0)} />
				<Tile label="Verified" value={String(counts.verified ?? 0)} />
				<Tile label="Packing" value={String(processing)} />
				<Tile label="Delivered" value={String(counts.delivered ?? 0)} />
				<Tile label="Cancelled" value={String(cancelled)} />
			</div>

			<div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-sm">
				<p className="text-[14px] text-muted">Total value of confirmed orders</p>
				<p className="text-3xl font-extrabold text-brand">{money(revenue)}</p>
			</div>

			<div className="mt-8 flex items-center justify-between">
				<h2 className="text-[19px] font-bold text-ink">Latest orders</h2>
				<Link href="/admin/orders" className="text-[15px] font-semibold text-brand hover:underline">
					See all →
				</Link>
			</div>

			{recent.length === 0 ? (
				<p className="mt-4 rounded-2xl border border-dashed border-line bg-white p-8 text-center text-[15px] text-muted">
					No orders yet. When a customer places one, it will appear here.
				</p>
			) : (
				<ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
					{recent.map((o) => (
						<li key={o.id}>
							<Link
								href={`/admin/orders/${o.id}`}
								className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-row"
							>
								<span>
									<span className="text-[15px] font-bold text-ink">{o.id}</span>{" "}
									<span className="text-[15px] text-ink-soft">· {o.customerName}</span>
									<span className="block text-[13px] text-muted">
										{o.city}, {o.state} · {o.itemCount} items
									</span>
								</span>
								<span className="text-right">
									<StatusPill status={o.status} />
									<span className="mt-1 block text-[14px] font-semibold text-ink">
										{o.hasPrices ? money(o.total) : "—"}
									</span>
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function Tile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
	return (
		<div
			className={`rounded-xl border p-3.5 shadow-sm ${
				highlight ? "border-brand/30 bg-brand/10" : "border-line bg-white"
			}`}
		>
			<p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted">{label}</p>
			<p className="text-2xl font-extrabold text-ink">{value}</p>
		</div>
	);
}
