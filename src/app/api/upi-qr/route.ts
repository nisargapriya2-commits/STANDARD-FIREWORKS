import { NextRequest, NextResponse } from "next/server";
import { buildUpiUri, generateUpiQrSvg } from "@/lib/upi";
import { getSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const amount = parseFloat(searchParams.get("amount") || "0");
		const orderId = searchParams.get("orderId") || "";
		const customUpi = searchParams.get("upi") || "";

		const settings = await getSettings();
		const upiId = customUpi || settings.upi;
		const payeeName = settings.bankHolder && settings.bankHolder !== "<Account holder>" 
			? settings.bankHolder 
			: "";

		const uri = buildUpiUri({
			upiId,
			payeeName,
			amount,
			orderId,
			note: orderId ? `Order ${orderId}` : "Fireworks Order",
		});

		const svg = await generateUpiQrSvg(uri, { margin: 1 });

		return new NextResponse(svg, {
			headers: {
				"Content-Type": "image/svg+xml; charset=utf-8",
				"Cache-Control": "private, no-cache, no-store, must-revalidate",
			},
		});
	} catch (err) {
		console.error("Failed to generate dynamic UPI QR code:", err);
		return new NextResponse("Error generating QR code", { status: 500 });
	}
}
