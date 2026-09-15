/**
 * Coupon data layer (server only).
 *
 * How many times a code has been used is never stored — it's COUNTED from the
 * orders holding it, excluding cancelled/rejected ones. So an abandoned checkout
 * frees the code by itself, and no status change can double-count a redemption.
 */

import { and, desc, eq, inArray, not, sql } from "drizzle-orm";
import { getDb, coupons, orders } from "@/lib/db";
import {
	type Coupon,
	type CouponRefusal,
	couponDiscount,
	refuseCoupon,
} from "@/lib/coupon-types";

/** Statuses that release the code again. */
const DEAD_STATUSES = ["cancelled", "rejected"] as const;

type Row = typeof coupons.$inferSelect;

function toCoupon(r: Row): Coupon {
	return {
		code: r.code,
		kind: r.kind === "percent" ? "percent" : "flat",
		value: r.value,
		maxDiscount: r.maxDiscount,
		minOrder: r.minOrder,
		phone: r.phone ?? "",
		customerName: r.customerName ?? "",
		maxUses: r.maxUses,
		active: r.active === 1,
		expiresAt: r.expiresAt ?? null,
		createdAt: r.createdAt,
		note: r.note ?? "",
		fromOrder: r.fromOrder ?? "",
	};
}

export async function getCoupon(code: string): Promise<Coupon | null> {
	const rows = await getDb()
		.select()
		.from(coupons)
		.where(eq(coupons.code, code.trim().toUpperCase()))
		.limit(1);
	return rows[0] ? toCoupon(rows[0]) : null;
}

/** Live redemptions of one code. */
export async function usedCount(code: string): Promise<number> {
	const rows = await getDb()
		.select({ n: sql<number>`count(*)` })
		.from(orders)
		.where(
			and(
				eq(orders.couponCode, code),
				not(inArray(orders.status, DEAD_STATUSES as unknown as string[])),
			),
		);
	return Number(rows[0]?.n ?? 0);
}

/** Redemptions for every code at once — one query for the admin list. */
export async function usedCounts(): Promise<Record<string, number>> {
	const rows = await getDb()
		.select({ code: orders.couponCode, n: sql<number>`count(*)` })
		.from(orders)
		.where(not(inArray(orders.status, DEAD_STATUSES as unknown as string[])))
		.groupBy(orders.couponCode);
	const out: Record<string, number> = {};
	for (const r of rows) if (r.code) out[r.code] = Number(r.n);
	return out;
}

export async function listCoupons(): Promise<Coupon[]> {
	const rows = await getDb().select().from(coupons).orderBy(desc(coupons.createdAt)).limit(300);
	return rows.map(toCoupon);
}

export type CheckResult =
	| { ok: true; discount: number; coupon: Coupon }
	| { ok: false; reason: CouponRefusal; minOrder: number };

/**
 * The single place a coupon is judged. Both the checkout's "Apply" button and
 * order creation call this, so the customer can never be shown one number and
 * charged another.
 *
 * `ignoreOrderId` lets an order re-validate its own coupon without counting
 * itself as a use.
 */
export async function checkCoupon(
	code: string,
	opts: { subtotal: number; phone: string; ignoreOrderId?: string },
): Promise<CheckResult> {
	const c = await getCoupon(code);
	if (!c) return { ok: false, reason: "not_found", minOrder: 0 };

	let used = await usedCount(c.code);
	if (opts.ignoreOrderId) {
		const mine = await getDb()
			.select({ id: orders.id })
			.from(orders)
			.where(and(eq(orders.id, opts.ignoreOrderId), eq(orders.couponCode, c.code)))
			.limit(1);
		if (mine[0]) used -= 1;
	}

	const reason = refuseCoupon(c, {
		subtotal: opts.subtotal,
		phone: opts.phone,
		usedCount: used,
		now: Date.now(),
	});
	if (reason) return { ok: false, reason, minOrder: c.minOrder };

	return { ok: true, discount: couponDiscount(c, opts.subtotal), coupon: c };
}

/* ---- writes (admin) ---- */

export async function createCoupon(c: Coupon): Promise<void> {
	await getDb().insert(coupons).values({
		code: c.code.trim().toUpperCase(),
		kind: c.kind,
		value: c.value,
		maxDiscount: c.maxDiscount,
		minOrder: c.minOrder,
		phone: c.phone || null,
		customerName: c.customerName || null,
		maxUses: c.maxUses,
		active: c.active ? 1 : 0,
		expiresAt: c.expiresAt,
		createdAt: c.createdAt,
		note: c.note || null,
		fromOrder: c.fromOrder || null,
	});
}

export async function setCouponActive(code: string, active: boolean): Promise<void> {
	await getDb().update(coupons).set({ active: active ? 1 : 0 }).where(eq(coupons.code, code));
}

export async function deleteCoupon(code: string): Promise<void> {
	await getDb().delete(coupons).where(eq(coupons.code, code));
}

/** A code that isn't taken yet. Collisions are vanishingly rare but cheap to rule out. */
export async function uniqueCode(gen: () => string, tries = 6): Promise<string> {
	for (let i = 0; i < tries; i++) {
		const code = gen();
		if (!(await getCoupon(code))) return code;
	}
	return `${gen()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
}
