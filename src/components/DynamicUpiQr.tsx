"use client";

import { useEffect, useState, useMemo } from "react";
import { buildUpiUri, generateUpiQrDataUrl } from "@/lib/upi";
import { money } from "@/lib/site";

export type DynamicUpiQrProps = {
	amount: number;
	orderId?: string | null;
	upiId: string;
	payeeName?: string;
	phone?: string;
};

export default function DynamicUpiQr({
	amount,
	orderId,
	upiId,
	payeeName = "Murugan Traders",
	phone,
}: DynamicUpiQrProps) {
	const [qrDataUrl, setQrDataUrl] = useState<string>("");
	const [copiedUpi, setCopiedUpi] = useState(false);
	const [copiedAmount, setCopiedAmount] = useState(false);
	const [generating, setGenerating] = useState(true);

	const formattedAmount = Math.max(0, amount);
	const amStr = formattedAmount.toFixed(2);

	// Build the universal UPI URI with pre-filled amount
	const upiUri = useMemo(() => {
		return buildUpiUri({
			upiId,
			payeeName,
			amount: formattedAmount,
			orderId,
			note: orderId ? `Order ${orderId}` : "Standard Fireworks Order",
		});
	}, [upiId, payeeName, formattedAmount, orderId]);

	// Generate crisp high-resolution QR data URL
	useEffect(() => {
		let isMounted = true;
		setGenerating(true);

		generateUpiQrDataUrl(upiUri, { width: 400, margin: 1 })
			.then((url) => {
				if (isMounted) {
					setQrDataUrl(url);
					setGenerating(false);
				}
			})
			.catch((err) => {
				console.error("Error generating QR code:", err);
				if (isMounted) {
					setGenerating(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [upiUri]);

	function copyToClipboard(text: string, type: "upi" | "amount") {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(text).then(() => {
				if (type === "upi") {
					setCopiedUpi(true);
					setTimeout(() => setCopiedUpi(false), 2500);
				} else {
					setCopiedAmount(true);
					setTimeout(() => setCopiedAmount(false), 2500);
				}
			});
		}
	}

	const fallbackApiSrc = `/api/upi-qr?amount=${amStr}&orderId=${encodeURIComponent(orderId || "")}&upi=${encodeURIComponent(upiId || "")}`;

	return (
		<div className="rounded-xl border-2 border-brand/20 bg-gradient-to-b from-amber-50/40 via-white to-white p-5 shadow-sm sm:p-6">
			{/* Top headline with pre-fill badge */}
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
				<div>
					<h3 className="text-[17px] font-bold text-ink">Scan &amp; Pay via UPI</h3>
					<p className="text-[13.5px] text-muted">Google Pay · PhonePe · Paytm · BHIM · Any UPI App</p>
				</div>
				<div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-bold text-emerald-800 ring-1 ring-emerald-600/20">
					<span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
					Amount Pre-filled: {money(formattedAmount)}
				</div>
			</div>

			<div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
				{/* QR Code Container */}
				<div className="flex flex-col items-center">
					<div className="relative rounded-2xl border-2 border-brand/30 bg-white p-3 shadow-md">
						{generating && !qrDataUrl ? (
							<div className="grid h-48 w-48 place-items-center rounded-xl bg-row text-center text-[13px] text-muted sm:h-52 sm:w-52">
								<div className="flex flex-col items-center gap-2">
									<div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
									<span>Generating dynamic QR…</span>
								</div>
							</div>
						) : (
							<div className="relative">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={qrDataUrl || fallbackApiSrc}
									alt={`Dynamic UPI QR Code for ${money(formattedAmount)}`}
									className="h-48 w-48 rounded-lg object-contain sm:h-52 sm:w-52"
								/>
								{/* Scan guide pill */}
								<div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase text-white shadow">
									₹{formattedAmount.toLocaleString("en-IN")} Exact
								</div>
							</div>
						)}
					</div>

					<p className="mt-4 text-center text-[12.5px] font-semibold text-emerald-800">
						✓ Pre-filled with exact ₹{formattedAmount.toLocaleString("en-IN")}
					</p>
					<p className="text-center text-[11.5px] text-muted">
						You do not need to enter the amount manually
					</p>

					{qrDataUrl && (
						<a
							href={qrDataUrl}
							download={`UPI-QR-${orderId || "Order"}-${formattedAmount}.png`}
							className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
						>
							📥 Save QR Code Image
						</a>
					)}
				</div>

				{/* Payment Details & Quick Actions */}
				<div className="flex flex-col justify-between space-y-4">
					{/* Mobile One-Tap Pay Button */}
					<div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="text-[13px] font-bold uppercase tracking-wider text-emerald-900">
								📱 Paying on this phone?
							</span>
							<span className="text-[12px] font-semibold text-emerald-700">1-Tap Fast Pay</span>
						</div>
						<a
							href={upiUri}
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-[15.5px] font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
						>
							<span>🚀</span> Open UPI App to Pay {money(formattedAmount)}
						</a>
						<p className="mt-2 text-center text-[12px] text-emerald-800">
							Tapping opens GPay, PhonePe, or Paytm with <strong>{money(formattedAmount)}</strong> pre-filled.
						</p>
					</div>

					{/* Manual UPI details with copy buttons */}
					<div className="space-y-2.5 rounded-lg border border-line bg-white p-3.5 text-[14px]">
						<div className="flex items-center justify-between gap-2">
							<div>
								<p className="text-[12px] font-medium uppercase tracking-wider text-muted">Payee UPI ID</p>
								<p className="select-all font-mono text-[15px] font-bold text-ink">{upiId}</p>
							</div>
							<button
								type="button"
								onClick={() => copyToClipboard(upiId, "upi")}
								className="shrink-0 rounded-md border border-line bg-row px-2.5 py-1 text-[12px] font-semibold text-ink transition hover:bg-gray-200 active:bg-gray-300"
							>
								{copiedUpi ? "✓ Copied!" : "Copy UPI ID"}
							</button>
						</div>

						<div className="flex items-center justify-between gap-2 border-t border-line/60 pt-2">
							<div>
								<p className="text-[12px] font-medium uppercase tracking-wider text-muted">Exact Amount</p>
								<p className="text-[16px] font-extrabold text-brand">{money(formattedAmount)}</p>
							</div>
							<button
								type="button"
								onClick={() => copyToClipboard(String(formattedAmount), "amount")}
								className="shrink-0 rounded-md border border-line bg-row px-2.5 py-1 text-[12px] font-semibold text-ink transition hover:bg-gray-200 active:bg-gray-300"
							>
								{copiedAmount ? "✓ Copied!" : "Copy Amount"}
							</button>
						</div>

						{phone && (
							<div className="border-t border-line/60 pt-2">
								<p className="text-[12px] font-medium uppercase tracking-wider text-muted">
									GPay / PhonePe Mobile Number
								</p>
								<p className="select-all text-[14px] font-semibold text-ink">{phone}</p>
							</div>
						)}
					</div>

					{/* Supported UPI Apps logos / text */}
					<div className="flex flex-wrap items-center gap-2 pt-1">
						<span className="text-[12px] font-medium text-muted">Accepted via:</span>
						{["Google Pay", "PhonePe", "Paytm", "BHIM", "Cred", "Any Bank UPI"].map((app) => (
							<span
								key={app}
								className="rounded border border-line bg-row px-2 py-0.5 text-[11.5px] font-medium text-ink-soft"
							>
								{app}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
