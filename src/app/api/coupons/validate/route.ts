import { NextRequest, NextResponse } from "next/server";
import { checkCoupon } from "@/lib/coupons";
import { couponLabel, refusalMessage } from "@/lib/coupon-types";

export const runtime = "nodejs";

/**
 * "Apply" on the checkout coupon box. Answers only what the customer needs to
 * see — the discount and a label. The real decision is made again when the order
 * is created, so a tampered response can't buy anything.
 */
export async function POST(req: NextRequest) {
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const code = typeof body.code === "string" ? body.code.trim() : "";
	const phone = typeof body.phone === "string" ? body.phone : "";
	const subtotal = Math.max(0, Math.floor(Number(body.subtotal) || 0));
	if (!code) return NextResponse.json({ ok: false, message: "Enter a code." }, { status: 400 });

	try {
		const res = await checkCoupon(code, { subtotal, phone });
		if (!res.ok) {
			return NextResponse.json({
				ok: false,
				message: refusalMessage(res.reason, res.minOrder),
			});
		}
		return NextResponse.json({
			ok: true,
			code: res.coupon.code,
			discount: res.discount,
			label: couponLabel(res.coupon),
		});
	} catch (e) {
		console.error("coupon validate failed", e);
		return NextResponse.json({ ok: false, message: "Could not check that code. Try again." });
	}
}
