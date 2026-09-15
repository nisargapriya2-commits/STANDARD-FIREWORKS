import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders } from "@/lib/db";
import { money } from "@/lib/site";
import { StatusPill } from "@/components/StatusPill";
import DeleteOrderButton from "./DeleteOrderButton";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
	await requireAdmin();
	const orders = await listOrders(300);

	return (
		<div>
			<h1 className="mb-6 text-[26px] font-extrabold text-ink">Orders ({orders.length})</h1>

			{orders.length === 0 ? (
				<p className="rounded-2xl border border-dashed border-line bg-white p-8 text-center text-[15px] text-muted">
					No orders yet. When a customer places one, it will appear here.
				</p>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
					<table className="w-full min-w-[760px] border-collapse text-[15px]">
						<thead>
							<tr className="bg-row text-left text-[12.5px] font-semibold uppercase tracking-wide text-muted">
								<th className="px-3 py-3">Order</th>
								<th className="px-3 py-3">Customer</th>
								<th className="px-3 py-3">Location</th>
								<th className="px-3 py-3">Items</th>
								<th className="px-3 py-3">Total</th>
								<th className="px-3 py-3">Status</th>
								<th className="px-3 py-3 text-right">Action</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr key={o.id} className="border-t border-line hover:bg-row">
									<td className="px-3 py-3">
										<Link href={`/admin/orders/${o.id}`} className="font-bold text-brand hover:underline">
											{o.id}
										</Link>
										<span className="block text-[12.5px] text-muted">
											{new Date(o.createdAt).toLocaleString("en-IN")}
										</span>
									</td>
									<td className="px-3 py-3 text-ink">
										{o.customerName}
										<span className="block text-[12.5px] text-muted">{o.phone}</span>
									</td>
									<td className="px-3 py-3 text-ink-soft">
										{o.area ? `${o.area}, ` : ""}{o.city}, {o.state}
										<span className="block text-[12.5px] text-muted">{o.pincode}</span>
									</td>
									<td className="px-3 py-3 text-ink">{o.itemCount}</td>
									<td className="px-3 py-3 font-semibold text-ink">{o.hasPrices ? money(o.total) : "—"}</td>
									<td className="px-3 py-3">
										<StatusPill status={o.status} />
									</td>
									<td className="px-3 py-3 text-right">
										<DeleteOrderButton orderId={o.id} customerName={o.customerName} variant="table" />
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
