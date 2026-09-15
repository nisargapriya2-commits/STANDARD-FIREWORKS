"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createCoupon, deleteCoupon, setCouponActive, uniqueCode } from "@/lib/coupons";
import { newCouponCode, type CouponKind } from "@/lib/coupon-types";

const DAY = 86_400_000;

function num(fd: FormData, k: string, d = 0): number {
	const v = Number(fd.get(k));
	return Number.isFinite(v) && v >= 0 ? Math.floor(v) : d;
}
function str(fd: FormData, k: string): string {
	const v = fd.get(k);
	return v === null ? "" : String(v).trim();
}

/**
 * Create a coupon. Used by both the Coupons tab and the "give this customer a
 * coupon" button on an order — the order version just arrives with the phone,
 * name and order id pre-filled.
 */
export async function createCouponAction(formData: FormData) {
	await requireAdmin();

	const kind: CouponKind = str(formData, "kind") === "percent" ? "percent" : "flat";
	const value = num(formData, "value");
	const days = num(formData, "days", 15);
	const fromOrder = str(formData, "fromOrder");
	const typed = str(formData, "code").toUpperCase();

	// A coupon worth nothing is always a mistake — bounce it rather than create
	// a code the owner will hand out and then wonder about.
	if (value <= 0) {
		redirect(fromOrder ? `/admin/orders/${fromOrder}?coupon=novalue` : "/admin/coupons?e=novalue");
	}

	const code = typed || (await uniqueCode(() => newCouponCode()));

	await createCoupon({
		code,
		kind,
		value,
		maxDiscount: kind === "percent" ? num(formData, "maxDiscount") : 0,
		minOrder: num(formData, "minOrder"),
		phone: str(formData, "phone"),
		customerName: str(formData, "customerName"),
		maxUses: Math.max(1, num(formData, "maxUses", 1)),
		active: true,
		expiresAt: days > 0 ? Date.now() + days * DAY : null,
		createdAt: Date.now(),
		note: str(formData, "note"),
		fromOrder,
	});

	revalidatePath("/admin/coupons");
	if (fromOrder) {
		revalidatePath(`/admin/orders/${fromOrder}`);
		redirect(`/admin/orders/${fromOrder}?coupon=${encodeURIComponent(code)}`);
	}
	redirect(`/admin/coupons?new=${encodeURIComponent(code)}`);
}

export async function toggleCouponAction(formData: FormData) {
	await requireAdmin();
	const code = str(formData, "code");
	await setCouponActive(code, str(formData, "to") === "on");
	revalidatePath("/admin/coupons");
	redirect("/admin/coupons");
}

export async function deleteCouponAction(formData: FormData) {
	await requireAdmin();
	await deleteCoupon(str(formData, "code"));
	revalidatePath("/admin/coupons");
	redirect("/admin/coupons?deleted=1");
}
