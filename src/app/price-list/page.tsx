import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getSettings, getPriceListPdfMeta } from "@/lib/catalog";
import { publicSite, waLinkTo } from "@/lib/site";
import { SparkBurst, WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = {
	title: "Official Price List PDF 2026 — Sivakasi Crackers",
	description:
		"View and download the official 2026 Sivakasi Standard Fireworks wholesale and retail price list PDF. Flat 50% discount on all crackers direct from Sivakasi.",
	keywords: [
		"crackers price list pdf",
		"Sivakasi crackers price list 2026 pdf",
		"Standard Fireworks price list pdf download",
		"wholesale crackers price list Chennai",
	],
	alternates: { canonical: "/price-list" },
};

export const dynamic = "force-dynamic";

export default async function PriceListPage() {
	const [settings, customPdf] = await Promise.all([
		getSettings(),
		getPriceListPdfMeta(),
	]);

	const site = publicSite(settings);

	// If owner uploaded a custom PDF, use that; otherwise fall back to the bundled 2026 starter PDF.
	const hasCustomPdf = Boolean(customPdf?.url);
	const pdfUrl = customPdf?.url || "/price-list.pdf";
	const pdfDownloadUrl = customPdf?.url
		? `${customPdf.url}&download=1`
		: "/price-list.pdf";
	const filename = customPdf?.filename || "Sivakasi-Standard-Fireworks-Price-List-2026.pdf";

	const waMessage = `Hi ${site.name}, I viewed your 2026 Price List PDF and would like to enquire about placing an order.`;
	const waUrl = waLinkTo(site.phone, waMessage);

	return (
		<div className="bg-[#faf6ef] text-ink">
			<PageHeader
				title="Official Price List"
				subtitle="View and download our verified Deepavali 2026 price list PDF. All crackers carry flat 50% discount off the printed list price."
			/>

			<div className="mx-auto max-w-[1120px] px-4 py-8 sm:py-10">
				{/* Top Action & Navigation Bar */}
				<div className="mb-6 flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:p-5">
					<div>
						<span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdecec] px-3 py-1 text-[13px] font-bold text-brand">
							📄 Deepavali 2026 Edition
						</span>
						<h2 className="mt-1 text-lg font-bold text-ink sm:text-xl">
							{filename}
						</h2>
						<p className="text-[13.5px] text-muted">
							{hasCustomPdf
								? "Latest price list uploaded by management."
								: "Standard Fireworks & Murugan Traders official catalogue."}
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
						{/* Direct Download Button */}
						<a
							href={pdfDownloadUrl}
							download={filename}
							className="glow-btn shimmer inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-gold via-yellow to-[#eaa72a] px-5 py-3 text-[14.5px] font-extrabold text-[#3a1a00] shadow-sm transition hover:brightness-105 active:scale-[.99]"
						>
							⬇️ Download Price List
						</a>

						{/* Fullscreen in new tab */}
						<a
							href={pdfUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-white px-4 py-3 text-[14px] font-semibold text-ink transition hover:bg-row"
						>
							↗ Open in New Tab
						</a>

						{/* Order Now (separate route to /products) */}
						<Link
							href="/products"
							className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand bg-brand px-4 py-3 text-[14px] font-bold text-white shadow-xs transition hover:brightness-110"
						>
							<SparkBurst className="h-4 w-4" /> Order Now
						</Link>
					</div>
				</div>

				{/* Mobile Quick Download Notice (helps phone browsers where iframes have quirks) */}
				<div className="mb-4 rounded-xl border border-yellow/30 bg-[#fef9ec] p-3.5 text-center sm:hidden">
					<p className="text-[13.5px] text-[#5a4208]">
						On a mobile device? You can view below or tap to download directly to your phone.
					</p>
					<a
						href={pdfDownloadUrl}
						download={filename}
						className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-yellow px-4 py-2.5 text-[14px] font-bold text-[#3a1a00]"
					>
						⬇️ Tap to Download PDF
					</a>
				</div>

				{/* Embedded PDF Viewer Frame */}
				<div className="overflow-hidden rounded-2xl border border-line bg-white shadow-md">
					{/* Viewer Window Toolbar */}
					<div className="flex flex-wrap items-center justify-between border-b border-line bg-[#f8f5ee] px-4 py-3 text-[13.5px] text-ink-soft">
						<div className="flex items-center gap-2 font-semibold">
							<span className="text-brand">PDF Document Viewer</span>
							<span className="hidden text-muted sm:inline">•</span>
							<span className="hidden text-muted sm:inline">{filename}</span>
						</div>
						<div className="flex items-center gap-3 text-[13px]">
							<a
								href={pdfDownloadUrl}
								download={filename}
								className="font-semibold text-brand hover:underline"
							>
								Download
							</a>
							<span>|</span>
							<a
								href={pdfUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="font-semibold text-brand hover:underline"
							>
								Fullscreen
							</a>
						</div>
					</div>

					{/* The PDF viewer */}
					<div className="relative min-h-[550px] w-full bg-[#525659] sm:min-h-[750px] lg:min-h-[850px]">
						<object
							data={pdfUrl}
							type="application/pdf"
							className="h-[550px] w-full sm:h-[750px] lg:h-[850px]"
						>
							<iframe
								src={pdfUrl}
								title="Price List PDF"
								className="h-[550px] w-full sm:h-[750px] lg:h-[850px] border-none"
							>
								<div className="p-8 text-center text-white">
									<p className="mb-4 text-lg font-semibold">
										Your browser cannot display embedded PDFs directly.
									</p>
									<a
										href={pdfDownloadUrl}
										download={filename}
										className="inline-flex items-center gap-2 rounded-lg bg-yellow px-5 py-3 font-bold text-[#3a1a00]"
									>
										⬇️ Click here to download the Price List PDF
									</a>
								</div>
							</iframe>
						</object>
					</div>
				</div>

				{/* Bottom Ordering Banner */}
				<div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
					<div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
						<div>
							<h3 className="text-xl font-extrabold text-ink sm:text-2xl">
								Ready to place your order?
							</h3>
							<p className="mt-1.5 max-w-xl text-[15px] text-muted">
								You can build your estimate interactively with real-time totals on our online catalog,
								or send us your requirements directly via WhatsApp.
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-center gap-3">
							<Link
								href="/products"
								className="glow-btn shimmer inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-gold via-yellow to-[#eaa72a] px-6 py-3.5 text-[15px] font-extrabold text-[#3a1a00] shadow-sm transition hover:brightness-105"
							>
								<SparkBurst className="h-4 w-4" /> Go to Order Now
							</Link>
							<a
								href={waUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-2 rounded-lg border border-[#25D366]/40 bg-[#eefbf2] px-5 py-3.5 text-[15px] font-bold text-[#1b7e3b] transition hover:bg-[#e1f8e7]"
							>
								<WhatsAppIcon className="h-4 w-4" /> Enquire on WhatsApp
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
