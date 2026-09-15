import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getPriceListPdfMeta } from "@/lib/catalog";
import {
	aCard,
	aCardTitle,
	aCardSub,
	aLabel,
	aHint,
	aBtn,
	aBtnGhost,
	aPageTitle,
	aSuccess,
} from "@/lib/admin-ui";
import {
	uploadAdminPriceListPdfAction,
	deleteAdminPriceListPdfAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPriceListPage({
	searchParams,
}: {
	searchParams: Promise<{ pdf?: string }>;
}) {
	await requireAdmin();
	const [{ pdf }, customPdf] = await Promise.all([
		searchParams,
		getPriceListPdfMeta(),
	]);

	const activeUrl = customPdf?.url || "/price-list.pdf";
	const activeFilename = customPdf?.filename || "Default Starter Catalogue (price-list.pdf)";
	const isCustom = Boolean(customPdf);

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className={aPageTitle}>Price List PDF Management</h1>
					<p className="mt-1 text-[15px] text-muted">
						Upload and control the official PDF price list shown to customers on the public website.
					</p>
				</div>
				<Link
					href="/price-list"
					target="_blank"
					className={aBtnGhost}
				>
					View Public Page ↗
				</Link>
			</div>

			{/* Status Alerts */}
			{pdf === "uploaded" && (
				<div className={aSuccess}>
					✓ Price list PDF uploaded and published successfully! The public page is now updated.
				</div>
			)}
			{pdf === "deleted" && (
				<div className={aSuccess}>
					✓ Custom PDF removed. The website has reverted to the default starter price list.
				</div>
			)}
			{pdf === "empty" && (
				<div className="mb-5 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-800">
					⚠️ Please select a PDF file from your computer before clicking upload.
				</div>
			)}
			{pdf === "toobig" && (
				<div className="mb-5 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-800">
					⚠️ That PDF is too large (max 8 MB). Please compress the file using a free PDF compressor and try again.
				</div>
			)}
			{pdf === "badfile" && (
				<div className="mb-5 flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[15px] font-semibold text-red-800">
					⚠️ The selected file is not a valid PDF document. Please upload a real .pdf file.
				</div>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				{/* 1. Current Active PDF Status */}
				<section className={aCard}>
					<h2 className={aCardTitle}>
						<span aria-hidden>📄</span> Active Price List Status
					</h2>
					<p className={aCardSub}>
						This document is currently served to visitors on the &quot;Price List&quot; button and page.
					</p>

					<div className="rounded-xl border border-line bg-[#faf6ef] p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<span
									className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-bold ${
										isCustom
											? "bg-emerald-100 text-emerald-800"
											: "bg-amber-100 text-amber-800"
									}`}
								>
									{isCustom ? "● Custom PDF Active" : "● Default Starter PDF Active"}
								</span>
								<h3 className="mt-2 text-[16px] font-bold text-ink break-all">
									{activeFilename}
								</h3>
								<p className="mt-1 text-[13px] text-muted">
									{isCustom
										? "Stored in Cloudflare database. Replaces the default file automatically."
										: "No custom PDF uploaded yet. The starter sample PDF is currently active."}
								</p>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
							<a
								href={activeUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink hover:bg-row"
							>
								↗ Preview in New Tab
							</a>
							<a
								href={isCustom ? `${activeUrl}&download=1` : activeUrl}
								download={activeFilename}
								className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13.5px] font-semibold text-ink hover:bg-row"
							>
								⬇️ Download File
							</a>

							{isCustom && (
								<form action={deleteAdminPriceListPdfAction} className="inline">
									<button
										type="submit"
										className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] font-semibold text-red-700 hover:bg-red-100"
									>
										🗑️ Remove Custom PDF
									</button>
								</form>
							)}
						</div>
					</div>

					<div className="mt-4 text-[13.5px] text-muted">
						💡 When you upload a new PDF, the website immediately swaps it for all visitors. You do not need to edit any code or restart servers.
					</div>
				</section>

				{/* 2. Upload / Replace PDF Form */}
				<section className={aCard}>
					<h2 className={aCardTitle}>
						<span aria-hidden>📤</span> {isCustom ? "Replace Price List PDF" : "Upload New Price List PDF"}
					</h2>
					<p className={aCardSub}>
						Select a PDF from your computer or phone. Uploading will automatically update the public site.
					</p>

					<form action={uploadAdminPriceListPdfAction} className="space-y-4">
						<div>
							<label className={aLabel}>Select PDF Document</label>
							<input
								type="file"
								name="priceListPdf"
								accept="application/pdf,.pdf"
								required
								className="mt-2 block w-full rounded-xl border border-dashed border-line bg-[#faf6ef] p-4 text-[14px] text-ink file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-[14px] file:font-semibold file:text-white hover:file:brightness-110"
							/>
							<p className={aHint}>
								Maximum file size: <strong>8 MB</strong>. Must be a valid PDF format.
							</p>
						</div>

						<button type="submit" className={aBtn}>
							{isCustom ? "Replace Active PDF Now" : "Upload & Publish PDF"}
						</button>
					</form>
				</section>
			</div>

			{/* 3. Live Embedded Viewer for Admin Verification */}
			<section className={aCard}>
				<div className="mb-3 flex items-center justify-between">
					<div>
						<h2 className={aCardTitle}>
							<span aria-hidden>👁️</span> Live Document Preview
						</h2>
						<p className={aCardSub}>
							This is a live preview of what visitors see embedded on the public Price List page.
						</p>
					</div>
					<a
						href={activeUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[14px] font-semibold text-brand hover:underline"
					>
						Open full screen ↗
					</a>
				</div>

				<div className="overflow-hidden rounded-xl border border-line bg-[#525659]">
					<iframe
						src={activeUrl}
						title="Price List Preview"
						className="h-[600px] w-full border-none"
					/>
				</div>
			</section>
		</div>
	);
}
