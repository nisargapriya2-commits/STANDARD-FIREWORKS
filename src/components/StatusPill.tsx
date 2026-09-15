import { STATUS_LABEL } from "@/lib/db";

/** Coloured status badge for an order's lifecycle state. */
export function StatusPill({ status }: { status: string }) {
	const map: Record<string, string> = {
		pending_payment: "bg-amber-400/20 text-amber-300",
		pending_verification: "bg-orange-400/20 text-orange-300",
		verified: "bg-sky-400/20 text-sky-300",
		confirmed: "bg-blue-400/20 text-blue-300",
		packing: "bg-indigo-400/20 text-indigo-300",
		ready: "bg-violet-400/20 text-violet-300",
		dispatched: "bg-fuchsia-400/20 text-fuchsia-300",
		delivered: "bg-emerald-400/20 text-emerald-300",
		cancelled: "bg-red-400/20 text-red-300",
		rejected: "bg-red-500/25 text-red-300",
	};
	return (
		<span
			className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
				map[status] ?? "bg-white/10 text-white/70"
			}`}
		>
			{STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
		</span>
	);
}
