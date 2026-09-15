"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getSettings, saveSettings, setPriceListPdf, deletePriceListPdf } from "@/lib/catalog";
import { emailConfigured, ownerEmail, sendEmail } from "@/lib/email";
import { SITE, areaKey, cleanMapUrl, type ServiceArea, type EmailTemplate } from "@/lib/site";
import {
	parseDeliveryCsv,
	parseDeliveryWorkbook,
	mergeDeliveryImport,
	analyzeSpreadsheet,
	extractSpreadsheetRows,
	mapRowsWithMapping,
	type ColumnMapping,
	type SpreadsheetAnalysis,
	type DeliveryCsvRow,
} from "@/lib/delivery-csv";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/db";

/** Owner clicks "Send test email" — proves the email integration works. */
export async function sendTestEmailAction() {
	await requireAdmin();
	if (!emailConfigured()) {
		redirect("/admin/settings?test=unconfigured");
	}
	const to = ownerEmail();
	const ok = await sendEmail({
		to,
		subject: `✅ ${SITE.name} — test email`,
		text:
			"This is a test from your admin panel.\n\n" +
			"If you're reading this, email notifications are working — new orders and order-status " +
			"updates will send automatically.\n\n— Sent from Admin → Settings",
	});
	redirect(`/admin/settings?test=${ok ? "ok" : "fail"}`);
}

/** Analyzes an uploaded spreadsheet (CSV or Excel) and checks header mapping confidence. */
export async function analyzeDeliverySpreadsheetAction(formData: FormData): Promise<{
	success: boolean;
	error?: string;
	analysis?: SpreadsheetAnalysis;
	rawBase64?: string;
	fileType?: "csv" | "xlsx";
	filename?: string;
}> {
	try {
		await requireAdmin();
		const file = formData.get("deliveryFile");
		if (!(file instanceof File) || file.size === 0) {
			return { success: false, error: "Please select a valid CSV or Excel file to upload." };
		}
		const filename = file.name;
		const lowerName = filename.toLowerCase();
		const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");
		const arrayBuf = await file.arrayBuffer();
		const uint8 = new Uint8Array(arrayBuf);
		const { headerRow, dataRows } = isExcel
			? extractSpreadsheetRows(uint8)
			: extractSpreadsheetRows(new TextDecoder("utf-8").decode(uint8));

		if (!headerRow.length || !dataRows.length) {
			return {
				success: false,
				error: "The uploaded file does not contain any readable table rows or headings.",
			};
		}

		const analysis = analyzeSpreadsheet(headerRow, dataRows);
		const rawBase64 = Buffer.from(uint8).toString("base64");

		return {
			success: true,
			analysis,
			rawBase64,
			fileType: isExcel ? "xlsx" : "csv",
			filename,
		};
	} catch (e) {
		console.error("Failed to analyze spreadsheet:", e);
		return { success: false, error: (e as Error)?.message || "Failed to process the uploaded file." };
	}
}

/** Executes delivery import using explicit or auto-detected column mapping. */
export async function executeDeliveryImportAction(payload: {
	rawBase64: string;
	fileType: "csv" | "xlsx";
	mapping: ColumnMapping;
}): Promise<{ success: boolean; count?: number; error?: string }> {
	try {
		await requireAdmin();
		const buf = Buffer.from(payload.rawBase64, "base64");
		const { headerRow, dataRows } =
			payload.fileType === "xlsx"
				? extractSpreadsheetRows(new Uint8Array(buf))
				: extractSpreadsheetRows(buf.toString("utf-8"));

		if (!headerRow.length || !dataRows.length) {
			return { success: false, error: "No readable data found in file." };
		}

		const rows = mapRowsWithMapping(headerRow, dataRows, payload.mapping);
		if (!rows.length) {
			return {
				success: false,
				error: "Could not import any areas. Make sure the mapped State and City columns contain valid data.",
			};
		}

		const cur = await getSettings();
		const merged = mergeDeliveryImport(cur, rows);
		await saveSettings({ ...cur, ...merged });
		revalidatePath("/checkout");
		revalidatePath("/admin/settings");

		return { success: true, count: rows.length };
	} catch (e) {
		console.error("Failed to execute mapped delivery import:", e);
		return { success: false, error: (e as Error)?.message || "Failed to import delivery areas." };
	}
}

/**
 * Direct form post fallback: accepts any CSV or Excel sheet and imports automatically.
 */
export async function importDeliveryFileAction(formData: FormData) {
	await requireAdmin();
	const file = formData.get("deliveryFile");
	if (!(file instanceof File) || file.size === 0) {
		redirect("/admin/settings?import=empty#delivery");
	}
	const name = (file as File).name.toLowerCase();
	const isExcel = name.endsWith(".xlsx") || name.endsWith(".xls");
	const arrayBuf = await (file as File).arrayBuffer();
	const uint8 = new Uint8Array(arrayBuf);
	const { headerRow, dataRows } = isExcel
		? extractSpreadsheetRows(uint8)
		: extractSpreadsheetRows(new TextDecoder("utf-8").decode(uint8));

	if (!headerRow.length || !dataRows.length) {
		redirect("/admin/settings?import=badfile#delivery");
	}

	const analysis = analyzeSpreadsheet(headerRow, dataRows);
	const rows = mapRowsWithMapping(headerRow, dataRows, analysis.detectedMapping);
	if (!rows.length) {
		redirect("/admin/settings?import=badfile#delivery");
	}
	const cur = await getSettings();
	const merged = mergeDeliveryImport(cur, rows);
	await saveSettings({ ...cur, ...merged });
	revalidatePath("/checkout");
	revalidatePath("/admin/settings");
	redirect(`/admin/settings?import=${rows.length}#delivery`);
}

// D1 caps a single stored value at 2MB; base64 inflates a file by ~4/3, so the
// raw upload has to stay well under that to leave room for the encoding overhead.
const MAX_PRICE_LIST_PDF_BYTES = 1_400_000; // ~1.4 MB

/**
 * Owner uploads the real price list as a PDF — the header's "Price List" button
 * downloads whatever is saved here. Replaces any PDF already there.
 */
export async function uploadPriceListPdfAction(formData: FormData) {
	await requireAdmin();
	const file = formData.get("priceListPdf");
	if (!(file instanceof File) || file.size === 0) {
		redirect("/admin/settings?pdf=empty#price-list-pdf");
	}
	const f = file as File;
	if (f.size > MAX_PRICE_LIST_PDF_BYTES) {
		redirect("/admin/settings?pdf=toobig#price-list-pdf");
	}
	const buf = Buffer.from(await f.arrayBuffer());
	// Trust the file's actual bytes, not its declared type/extension — a renamed
	// or corrupt upload doesn't start with the PDF magic number.
	if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
		redirect("/admin/settings?pdf=badfile#price-list-pdf");
	}
	await setPriceListPdf(`data:application/pdf;base64,${buf.toString("base64")}`, f.name || "price-list.pdf");
	revalidatePath("/", "layout"); // the header/download link lives on every page
	revalidatePath("/price-list");
	revalidatePath("/admin/price-list");
	revalidatePath("/admin/settings");
	redirect("/admin/settings?pdf=uploaded#price-list-pdf");
}

export async function deletePriceListPdfAction() {
	await requireAdmin();
	await deletePriceListPdf();
	revalidatePath("/", "layout");
	revalidatePath("/price-list");
	revalidatePath("/admin/price-list");
	revalidatePath("/admin/settings");
	redirect("/admin/settings?pdf=deleted#price-list-pdf");
}

export async function saveSettingsAction(formData: FormData) {
	await requireAdmin();
	const cur = await getSettings();
	const s = (k: string, d: string) => {
		const v = formData.get(k);
		return v === null ? d : String(v).trim();
	};
	const n = (k: string, d: number) => {
		const v = Number(formData.get(k));
		return Number.isFinite(v) && v >= 0 ? Math.floor(v) : d;
	};
	const serviceStates = s("serviceStates", cur.serviceStates.join(", "))
		.split(",")
		.map((x) => x.trim())
		.filter(Boolean);

	// Per-state transport fee + serviceable cities come from `fee::<state>` /
	// `cities::<state>` fields, keyed to the current state list.
	const transportFees: Record<string, number> = {};
	const serviceCities: Record<string, string[]> = {};
	for (const st of serviceStates) {
		transportFees[st] = n(`fee::${st}`, cur.transportFees[st] ?? 0);
		serviceCities[st] = s(`cities::${st}`, (cur.serviceCities[st] ?? []).join(", "))
			.split(",")
			.map((x) => x.trim())
			.filter(Boolean);
	}

	// Level 3 — areas inside each city, from `area::<state>::<city>::<i>::name|map`.
	// The owner can add unlimited rows in the browser, so the slot numbers are
	// discovered from what was actually submitted rather than assumed. A row with
	// a blank name is dropped, which is also how the owner deletes an area. A city
	// that isn't in the submitted list any more (renamed/removed) loses its areas.
	const serviceAreas: Record<string, ServiceArea[]> = {};
	for (const st of serviceStates) {
		for (const city of serviceCities[st]) {
			const key = areaKey(st, city);
			const prev = cur.serviceAreas?.[key] ?? [];
			const prefix = `area::${key}::`;
			const suffix = "::name";
			const slots: number[] = [];
			for (const field of formData.keys()) {
				if (!field.startsWith(prefix) || !field.endsWith(suffix)) continue;
				const i = Number(field.slice(prefix.length, field.length - suffix.length));
				if (Number.isInteger(i) && i >= 0) slots.push(i);
			}
			slots.sort((a, b) => a - b);

			const rows: ServiceArea[] = [];
			for (const i of slots) {
				const name = s(`${prefix}${i}${suffix}`, "");
				// Skip blanks and repeats — two areas with the same name would give the
				// customer a dropdown with two identical options.
				if (!name || rows.some((r) => r.name.toLowerCase() === name.toLowerCase())) continue;
				const address = s(`${prefix}${i}::address`, "");
				const pincode = s(`${prefix}${i}::pincode`, "");
				rows.push({
					name,
					...(address ? { address } : {}),
					...(pincode ? { pincode } : {}),
					mapUrl: cleanMapUrl(s(`${prefix}${i}::map`, "")),
				});
			}
			// A city rendered before this feature existed has no area fields at all —
			// keep whatever was saved rather than silently wiping it.
			if (rows.length) serviceAreas[key] = rows;
			else if (!slots.length && prev.length) serviceAreas[key] = prev;
		}
	}

	// Discount tiers — up to 4 rows (tierMin::i / tierExtra::i / tierLabel::i).
	// A row counts only if it has a positive spend threshold.
	const discountTiers = [];
	for (let i = 0; i < 4; i++) {
		const min = n(`tierMin::${i}`, 0);
		const extra = n(`tierExtra::${i}`, 0);
		const label = s(`tierLabel::${i}`, "");
		if (min > 0) {
			discountTiers.push({ min, extra, label: label || `Spend ₹${min.toLocaleString("en-IN")}+` });
		}
	}

	// Customer email wording — a subject + a message per order status
	// (emailTplSubject::<status> / emailTpl::<status>). Either left blank →
	// falls back to the built-in default for that one, independently.
	const emailTemplates: Partial<Record<OrderStatus, EmailTemplate>> = {};
	for (const st of ORDER_STATUSES) {
		const subject = s(`emailTplSubject::${st}`, cur.emailTemplates[st]?.subject ?? "");
		const body = s(`emailTpl::${st}`, cur.emailTemplates[st]?.body ?? "");
		if (subject || body) emailTemplates[st] = { subject: subject || undefined, body: body || undefined };
	}

	try {
		await saveSettings({
			phone: s("phone", cur.phone),
			whatsapp: s("whatsapp", cur.whatsapp).replace(/\D/g, ""),
			email: s("email", cur.email),
			upi: s("upi", cur.upi),
			upiQr: s("upiQr", cur.upiQr),
			minOrder: n("minOrder", cur.minOrder),
			discountPct: n("discountPct", cur.discountPct),
			bankName: s("bankName", cur.bankName),
			bankBranch: s("bankBranch", cur.bankBranch),
			bankAccount: s("bankAccount", cur.bankAccount),
			bankIfsc: s("bankIfsc", cur.bankIfsc),
			bankHolder: s("bankHolder", cur.bankHolder),
			serviceStates,
			transportFees,
			serviceCities,
			serviceAreas,
			gstPct: n("gstPct", cur.gstPct),
			requireUtr: formData.get("requireUtr") === "on",
			metaTitle: s("metaTitle", cur.metaTitle),
			metaDescription: s("metaDescription", cur.metaDescription),
			gaId: s("gaId", cur.gaId),
			logo: s("logo", cur.logo),
			announcement: s("announcement", cur.announcement),
			festivalName: s("festivalName", cur.festivalName),
			festivalDate: s("festivalDate", cur.festivalDate),

			// content / identity
			tagline: s("tagline", cur.tagline),
			hours: s("hours", cur.hours),
			addressLine: s("addressLine", cur.addressLine),
			legalName: s("legalName", cur.legalName),
			gstNumber: s("gstNumber", cur.gstNumber),
			licence: s("licence", cur.licence),
			stockistOf: s("stockistOf", cur.stockistOf),
			aboutStory: s("aboutStory", cur.aboutStory),
			discountTiers: discountTiers.length ? discountTiers : cur.discountTiers,
			facebook: s("facebook", cur.facebook),
			instagram: s("instagram", cur.instagram),
			youtube: s("youtube", cur.youtube),
			emailTemplates,
		});
		revalidatePath("/", "layout"); // header/footer live on every page
		revalidatePath("/");
		revalidatePath("/about");
		revalidatePath("/faq");
		revalidatePath("/contact");
		revalidatePath("/checkout");
		revalidatePath("/products");
		revalidatePath("/admin/settings");
	} catch (e) {
		console.error("saveSettingsAction failed:", e);
		redirect(`/admin/settings?error=${encodeURIComponent((e as Error)?.message || "Failed to save settings")}`);
	}
	redirect("/admin/settings?saved=1");
}
