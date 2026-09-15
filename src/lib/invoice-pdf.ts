/**
 * Customer invoice as a PDF, generated with pdf-lib (pure JS — runs on Cloudflare Workers & Node).
 * Exactly matches the visual and structural layout of the reference invoice:
 * - Clean black-and-white header with company & invoice metadata
 * - BILL TO section
 * - Items split into STANDARD and ELITE BRAND sections
 * - Continuous item numbering (# 1, 2, 3...) across both sections
 * - Right-aligned totals breakdown (Subtotal, Spend offer, Transport, Grand total)
 * - Payment details (UTR, UPI, Bank) and footer
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { SITE, type Settings } from "@/lib/site";
import { STATUS_LABEL, type OrderRow, type OrderItem, type OrderStatus } from "@/lib/db";
import { SEED_PRODUCTS } from "@/lib/seed-data";

const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height in points
const MARGIN = 40;
const INK = rgb(0.08, 0.08, 0.08);
const MUTED = rgb(0.4, 0.4, 0.4);
const LINE = rgb(0.85, 0.85, 0.85);
const HEADER_BG = rgb(0.94, 0.94, 0.94);

// pdf-lib standard fonts only support WinAnsi (cp1252) characters.
const WINANSI_SAFE = /[^\x20-\x7E -ÿ–—‘’“”…•]/g;
function safeText(s: string): string {
	return s.replace(/₹/g, "Rs ").replace(WINANSI_SAFE, "?");
}

const moneyPdf = (n: number) => "Rs " + Number(n).toLocaleString("en-IN");

export type InvoiceOrder = Pick<
	OrderRow,
	| "id"
	| "createdAt"
	| "status"
	| "customerName"
	| "phone"
	| "address"
	| "city"
	| "state"
	| "area"
	| "pincode"
	| "email"
	| "gstNo"
	| "total"
	| "gst"
	| "transport"
	| "grandTotal"
	| "hasPrices"
	| "tierDiscount"
	| "tierLabel"
	| "couponCode"
	| "couponDiscount"
	| "paymentRef"
	| "utr"
>;

/** Sanitizes, draws text, and returns the y just below it. */
function line(
	page: PDFPage,
	text: string,
	x: number,
	y: number,
	font: PDFFont,
	size: number,
	color = INK,
	maxWidth?: number,
): number {
	page.drawText(safeText(text), { x, y, size, font, color, ...(maxWidth ? { maxWidth } : {}) });
	return y - size - 3;
}

/** x position that right-aligns text against rightEdge. */
function rightAlign(font: PDFFont, size: number, text: string, rightEdge: number): number {
	return rightEdge - font.widthOfTextAtSize(safeText(text), size);
}

/** Determines whether an order item belongs to ELITE BRAND or STANDARD. */
export function isEliteItem(it: OrderItem): boolean {
	const rawLine = (it as { line?: string }).line;
	if (rawLine === "elite") return true;
	if (rawLine === "standard") return false;
	const id = (it.id || "").toLowerCase();
	if (id.startsWith("elite")) return true;
	if (id.startsWith("standard")) return false;
	const seed = SEED_PRODUCTS.find((p) => p.id.toLowerCase() === id);
	if (seed) {
		return seed.categoryId.toLowerCase().startsWith("elite");
	}
	if (it.name && /\belite\b/i.test(it.name)) return true;
	return false;
}

export async function buildInvoicePdf(
	order: InvoiceOrder,
	items: OrderItem[],
	settings: Settings,
): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const regular = await doc.embedFont(StandardFonts.Helvetica);
	const bold = await doc.embedFont(StandardFonts.HelveticaBold);

	let page = doc.addPage([PAGE_W, PAGE_H]);
	let y = PAGE_H - MARGIN;
	const left = MARGIN;
	const right = PAGE_W - MARGIN;

	const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

	// ---- 1. HEADER ----
	// Left: Company details
	const headerTop = y;
	y = line(page, SITE.name, left, y, bold, 17, INK);
	y = line(page, settings.legalName || "Murugan Traders", left, y, regular, 9.5, MUTED);
	y = line(page, "Sivakasi, Tamil Nadu", left, y, regular, 9.5, MUTED);
	const contactStr = `${settings.phone || SITE.phone}  ·  ${settings.email || SITE.email}`;
	y = line(page, contactStr, left, y, regular, 9, MUTED);
	const leftBottom = y;

	// Right: Invoice title & metadata
	let ry = headerTop;
	const title = "INVOICE";
	ry = line(page, title, rightAlign(bold, 17, title, right), ry, bold, 17, INK);
	const metaLines = [
		`Invoice no: ${order.id}`,
		`Date: ${date}`,
		`Status: ${STATUS_LABEL[order.status as OrderStatus] || order.status}`,
	];
	for (const m of metaLines) {
		ry = line(page, m, rightAlign(regular, 9.5, m, right), ry, regular, 9.5, MUTED);
	}

	y = Math.min(leftBottom, ry) - 12;
	page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1.2, color: INK });
	y -= 16;

	// ---- 2. BILL TO ----
	y = line(page, "BILL TO", left, y, bold, 9, INK);
	y -= 2;
	y = line(page, order.customerName || "Customer", left, y, bold, 11, INK);
	if (order.phone) y = line(page, order.phone, left, y, regular, 9.5, MUTED);
	if (order.address) y = line(page, order.address, left, y, regular, 9.5, MUTED);
	const courierAddress = `${order.area ? order.area + ", " : ""}${order.city}, ${order.state}${order.pincode ? " " + order.pincode : ""}`;
	if (courierAddress.trim()) y = line(page, courierAddress, left, y, regular, 9.5, MUTED);
	if (order.email) y = line(page, order.email, left, y, bold, 9.5, INK); // Bold as in reference
	if (order.gstNo) y = line(page, `GSTIN: ${order.gstNo}`, left, y, regular, 9, MUTED);
	y -= 14;

	// ---- 3. ITEMS TABLE DEFINITIONS ----
	const colN = left + 2;
	const colItem = left + 26;
	const colQty = right - 160;
	const colRate = right - 90;
	const colAmt = right - 4;

	const drawTableHeader = () => {
		page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1.2, color: INK });
		y -= 13;
		line(page, "#", colN, y, bold, 9, INK);
		line(page, "Item", colItem, y, bold, 9, INK);
		line(page, "Qty", rightAlign(bold, 9, "Qty", colQty), y, bold, 9, INK);
		line(page, "Rate", rightAlign(bold, 9, "Rate", colRate), y, bold, 9, INK);
		line(page, "Amount", rightAlign(bold, 9, "Amount", colAmt), y, bold, 9, INK);
		y -= 5;
		page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1.0, color: INK });
		y -= 4;
	};

	const drawSectionHeader = (sectionTitle: string) => {
		if (y < MARGIN + 120) {
			page = doc.addPage([PAGE_W, PAGE_H]);
			y = PAGE_H - MARGIN;
			drawTableHeader();
		}
		const barH = 15;
		page.drawRectangle({
			x: left,
			y: y - barH + 3,
			width: right - left,
			height: barH,
			color: HEADER_BG,
		});
		page.drawLine({ start: { x: left, y: y + 3 }, end: { x: right, y: y + 3 }, thickness: 0.75, color: INK });
		page.drawLine({ start: { x: left, y: y - barH + 3 }, end: { x: right, y: y - barH + 3 }, thickness: 0.75, color: INK });
		line(page, sectionTitle, left + 6, y - 8, bold, 9, INK);
		y -= barH + 8;
	};

	drawTableHeader();

	// Group items into STANDARD and ELITE BRAND
	const standardItems = items.filter((it) => !isEliteItem(it));
	const eliteItems = items.filter((it) => isEliteItem(it));

	let currentItemNum = 1;

	const renderItemList = (itemList: OrderItem[]) => {
		for (const it of itemList) {
			const itemHeight = it.content ? 28 : 18;
			if (y - itemHeight < MARGIN + 120) {
				page = doc.addPage([PAGE_W, PAGE_H]);
				y = PAGE_H - MARGIN;
				drawTableHeader();
			}

			// Number & Item Name
			line(page, String(currentItemNum++), colN, y, regular, 9.5, INK);
			line(page, it.name, colItem, y, regular, 9.5, INK, colQty - colItem - 10);

			// Qty, Rate, Amount
			const qtyStr = String(it.qty);
			const rateStr = it.unit ? moneyPdf(it.unit) : "—";
			const amtStr = it.total ? moneyPdf(it.total) : "—";
			line(page, qtyStr, rightAlign(regular, 9.5, qtyStr, colQty), y, regular, 9.5, INK);
			line(page, rateStr, rightAlign(regular, 9.5, rateStr, colRate), y, regular, 9.5, INK);
			line(page, amtStr, rightAlign(regular, 9.5, amtStr, colAmt), y, regular, 9.5, INK);

			y -= 12;

			// Subtitle packaging content (e.g. 10 Pcs)
			if (it.content) {
				line(page, it.content, colItem, y, regular, 8, MUTED, colQty - colItem - 10);
				y -= 10;
			}

			page.drawLine({ start: { x: left, y: y + 3 }, end: { x: right, y: y + 3 }, thickness: 0.5, color: LINE });
			y -= 4;
		}
	};

	if (standardItems.length > 0) {
		drawSectionHeader("STANDARD");
		renderItemList(standardItems);
	}

	if (eliteItems.length > 0) {
		drawSectionHeader("ELITE BRAND");
		renderItemList(eliteItems);
	}

	// Fallback if order has 0 items
	if (standardItems.length === 0 && eliteItems.length === 0) {
		drawSectionHeader("STANDARD");
		y -= 8;
	}

	// ---- 4. TOTALS SECTION ----
	if (y < MARGIN + 180) {
		page = doc.addPage([PAGE_W, PAGE_H]);
		y = PAGE_H - MARGIN;
	}

	y -= 10;
	const totalsLeft = colRate - 120;
	const totalsRight = colAmt;

	const totalsRow = (
		label: string,
		value: string,
		opts?: { bold?: boolean; color?: ReturnType<typeof rgb>; valColor?: ReturnType<typeof rgb> },
	) => {
		const f = opts?.bold ? bold : regular;
		const lblCol = opts?.color ?? MUTED;
		const valCol = opts?.valColor ?? (opts?.bold ? INK : INK);
		line(page, label, totalsLeft, y, f, 9.5, lblCol);
		line(page, value, rightAlign(f, 9.5, value, totalsRight), y, f, 9.5, valCol);
		y -= 15;
	};

	totalsRow("Subtotal", order.hasPrices ? moneyPdf(order.total) : "TBC");

	if (order.tierDiscount > 0) {
		totalsRow(
			`Spend offer${order.tierLabel ? ` (${order.tierLabel})` : ""}`,
			`-${moneyPdf(order.tierDiscount)}`,
			{ color: rgb(0.06, 0.45, 0.32), valColor: rgb(0.06, 0.45, 0.32) },
		);
	}

	if (order.couponCode) {
		totalsRow(
			`Discount code ${order.couponCode}`,
			`-${moneyPdf(order.couponDiscount)}`,
			{ color: rgb(0.06, 0.45, 0.32), valColor: rgb(0.06, 0.45, 0.32) },
		);
	}

	if (order.gst > 0) {
		totalsRow("GST", moneyPdf(order.gst));
	}

	totalsRow("Transport", moneyPdf(order.transport));

	// Grand total divider line
	y += 3;
	page.drawLine({ start: { x: totalsLeft, y }, end: { x: totalsRight, y }, thickness: 0.8, color: INK });
	y -= 12;

	const grand = order.hasPrices ? moneyPdf(order.grandTotal || order.total + order.transport) : "TBC";
	totalsRow("Grand total", grand, { bold: true });

	y += 3;
	page.drawLine({ start: { x: totalsLeft, y }, end: { x: totalsRight, y }, thickness: 0.8, color: INK });
	y -= 18;

	// ---- 5. PAYMENT & FOOTER SECTION ----
	page.drawLine({ start: { x: left, y: y + 4 }, end: { x: right, y: y + 4 }, thickness: 0.75, color: LINE });
	y -= 8;

	y = line(page, "PAYMENT", left, y, bold, 9, MUTED);
	y -= 2;
	y = line(page, `UTR / reference: ${order.paymentRef || order.utr || "—"}`, left, y, regular, 9.5, MUTED);
	if (settings.upi) {
		y = line(page, `UPI: ${settings.upi}`, left, y, regular, 9.5, MUTED);
	}
	if (settings.bankAccount) {
		const bankStr = `${settings.bankHolder} · ${settings.bankName} · A/c ${settings.bankAccount} · IFSC ${settings.bankIfsc}`;
		y = line(page, bankStr, left, y, regular, 9, MUTED);
	}
	y -= 10;

	line(page, "This is a computer-generated invoice.", left, y, regular, 8.5, MUTED);
	y -= 12;
	line(page, `Thank you for your order — ${SITE.name}.`, left, y, bold, 9.5, INK);

	return doc.save();
}
