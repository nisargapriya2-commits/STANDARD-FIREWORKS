import { type Coupon, couponLabel } from "@/lib/coupon-types";

/**
 * The WhatsApp message the owner sends after generating a code.
 *
 * Written the way he'd say it on the phone — the code, what it's worth, where to
 * type it, and when it runs out. Nothing else, because anything longer gets
 * trimmed by hand before sending.
 */
export function couponWhatsAppMessage(c: Coupon, shopName: string): string {
	const lines = [
		`Thank you for your enquiry 🙏`,
		``,
		`As discussed, here is your special discount code:`,
		``,
		`   ${c.code}   (${couponLabel(c)})`,
		``,
		`Type it in the "Have a discount code?" box on the checkout page and the amount comes off your total.`,
	];

	if (c.minOrder > 0) {
		lines.push(``, `Works on orders above ₹${c.minOrder.toLocaleString("en-IN")}.`);
	}
	if (c.expiresAt) {
		lines.push(`Valid till ${new Date(c.expiresAt).toLocaleDateString("en-IN")}.`);
	}
	if (c.phone) {
		lines.push(`This code is reserved for your number only.`);
	}

	lines.push(``, `— ${shopName}`);
	return lines.join("\n");
}
