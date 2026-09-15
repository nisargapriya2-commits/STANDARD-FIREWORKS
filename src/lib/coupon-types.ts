/**
 * Coupon types + the pure money maths.
 *
 * Client-safe on purpose (no server imports): the checkout needs the same
 * arithmetic the API uses, and the admin form needs it to preview what the owner
 * is about to give away. The server ALWAYS recomputes — nothing here is trusted
 * when an order is actually created.
 */

export type CouponKind = "flat" | "percent";

export type Coupon = {
	code: string;
	kind: CouponKind;
	value: number; // rupees off, or percent off
	maxDiscount: number; // ₹ cap on percent codes; 0 = uncapped
	minOrder: number; // product subtotal required
	phone: string; // "" = usable by anyone
	customerName: string;
	maxUses: number;
	active: boolean;
	expiresAt: number | null; // ms epoch
	createdAt: number;
	note: string;
	fromOrder: string;
};

/** Why a code was refused. Keys map to the customer-facing text below. */
export type CouponRefusal =
	| "not_found"
	| "inactive"
	| "expired"
	| "used_up"
	| "wrong_phone"
	| "min_order";

/** Wording the CUSTOMER sees at checkout — never blames them, says what to do. */
export function refusalMessage(reason: CouponRefusal, minOrder = 0): string {
	switch (reason) {
		case "not_found":
			return "We don't recognise that code. Check the spelling and try again.";
		case "inactive":
			return "This code is no longer active. Please call us and we'll sort it out.";
		case "expired":
			return "This code has expired. Call us and we'll issue a new one.";
		case "used_up":
			return "This code has already been used.";
		case "wrong_phone":
			return "This code was issued to a different phone number. Enter the number it was sent to.";
		case "min_order":
			return `This code needs an order of at least ₹${minOrder.toLocaleString("en-IN")}.`;
	}
}

/** Last 10 digits — so 9344170018, +91 93441 70018 and 919344170018 all match. */
export const phoneKey = (v: string) => v.replace(/\D/g, "").slice(-10);

/**
 * What this coupon takes off a given product subtotal.
 * Never exceeds the subtotal, so a grand total can't go negative.
 */
export function couponDiscount(c: Pick<Coupon, "kind" | "value" | "maxDiscount">, subtotal: number): number {
	if (subtotal <= 0) return 0;
	if (c.kind === "percent") {
		let d = Math.floor((subtotal * c.value) / 100);
		if (c.maxDiscount > 0) d = Math.min(d, c.maxDiscount);
		return Math.min(d, subtotal);
	}
	return Math.min(c.value, subtotal);
}

/**
 * Everything except "has it been used up" — that needs a database count, so the
 * caller passes `usedCount` in. Returns null when the coupon is good to use.
 */
export function refuseCoupon(
	c: Coupon,
	opts: { subtotal: number; phone: string; usedCount: number; now: number },
): CouponRefusal | null {
	if (!c.active) return "inactive";
	if (c.expiresAt !== null && c.expiresAt < opts.now) return "expired";
	if (opts.usedCount >= c.maxUses) return "used_up";
	if (c.phone && phoneKey(c.phone) !== phoneKey(opts.phone)) return "wrong_phone";
	if (opts.subtotal < c.minOrder) return "min_order";
	return null;
}

/** "₹2,000 off" / "5% off (max ₹3,000)" — one label used everywhere. */
export function couponLabel(c: Pick<Coupon, "kind" | "value" | "maxDiscount">): string {
	if (c.kind === "flat") return `₹${c.value.toLocaleString("en-IN")} off`;
	return c.maxDiscount > 0
		? `${c.value}% off (max ₹${c.maxDiscount.toLocaleString("en-IN")})`
		: `${c.value}% off`;
}

/**
 * Code generator. Skips O/0/I/1 — these get read out over the phone and written
 * down by hand, so ambiguous characters cause real support calls.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newCouponCode(prefix = "SF"): string {
	const bytes = crypto.getRandomValues(new Uint8Array(5));
	let s = "";
	for (let i = 0; i < 5; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
	return `${prefix}-${s}`;
}
