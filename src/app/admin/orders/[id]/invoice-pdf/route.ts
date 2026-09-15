import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrder, parseItems } from "@/lib/db";
import { getSettings } from "@/lib/catalog";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only PDF download of the invoice — the same file the order-received
 * email attaches automatically once Resend is configured. Until then, this is
 * how the owner gets it: download here, then attach it by hand to the mailto
 * draft opened from the order page (mailto links can't carry attachments).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	await requireAdmin();
	const { id } = await params;
	const [order, settings] = await Promise.all([getOrder(id), getSettings()]);
	if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

	const items = parseItems(order.itemsJson);
	const pdfBytes = await buildInvoicePdf(order, items, settings);
	return new NextResponse(Buffer.from(pdfBytes), {
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="Invoice-${order.id}.pdf"`,
		},
	});
}
