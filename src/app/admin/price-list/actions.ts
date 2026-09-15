"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { setPriceListPdf, deletePriceListPdf } from "@/lib/catalog";

// Multi-page PDFs supported via chunked D1 storage (up to 8 MB)
const MAX_PRICE_LIST_PDF_BYTES = 8_000_000; // ~8 MB

export async function uploadAdminPriceListPdfAction(formData: FormData) {
	await requireAdmin();
	const file = formData.get("priceListPdf");
	if (!(file instanceof File) || file.size === 0) {
		redirect("/admin/price-list?pdf=empty");
	}
	const f = file as File;
	if (f.size > MAX_PRICE_LIST_PDF_BYTES) {
		redirect("/admin/price-list?pdf=toobig");
	}
	const buf = Buffer.from(await f.arrayBuffer());
	// Validate PDF magic number
	if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
		redirect("/admin/price-list?pdf=badfile");
	}
	await setPriceListPdf(
		`data:application/pdf;base64,${buf.toString("base64")}`,
		f.name || "price-list.pdf",
	);
	revalidatePath("/", "layout");
	revalidatePath("/price-list");
	revalidatePath("/admin/price-list");
	revalidatePath("/admin/settings");
	redirect("/admin/price-list?pdf=uploaded");
}

export async function deleteAdminPriceListPdfAction() {
	await requireAdmin();
	await deletePriceListPdf();
	revalidatePath("/", "layout");
	revalidatePath("/price-list");
	revalidatePath("/admin/price-list");
	revalidatePath("/admin/settings");
	redirect("/admin/price-list?pdf=deleted");
}
