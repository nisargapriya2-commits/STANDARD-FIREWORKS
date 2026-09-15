/**
 * D1 + Drizzle data layer for orders / enquiries.
 *
 * Bindings only exist at request time, so call getDb() INSIDE a route handler /
 * server action — never at module top level.
 */

import { drizzle } from "drizzle-orm/d1";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { desc, eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const orders = sqliteTable("orders", {
	id: text("id").primaryKey(),
	createdAt: integer("created_at").notNull(),
	status: text("status").notNull().default("new"),
	customerName: text("customer_name").notNull(),
	phone: text("phone").notNull(),
	whatsapp: text("whatsapp"),
	address: text("address").notNull(),
	city: text("city").notNull(),
	state: text("state").notNull(),
	area: text("area"), // locality inside the city (3rd delivery level)
	areaMap: text("area_map"), // Google Maps link of that area's delivery point
	pincode: text("pincode").notNull(),
	email: text("email"),
	gstNo: text("gst_no"),
	itemsJson: text("items_json").notNull(),
	itemCount: integer("item_count").notNull().default(0),
	total: integer("total").notNull().default(0), // product total (net)
	gst: integer("gst").notNull().default(0), // GST amount
	transport: integer("transport").notNull().default(0), // per-state transport fee
	grandTotal: integer("grand_total").notNull().default(0), // total + gst + transport
	hasPrices: integer("has_prices").notNull().default(0),
	utr: text("utr"), // payment transaction/UTR the customer entered
	screenshotData: text("screenshot_data"), // payment receipt (compressed data URL)
	paymentRef: text("payment_ref"),
	adminNote: text("admin_note"),
	couponCode: text("coupon_code"), // code the customer redeemed
	couponDiscount: integer("coupon_discount").notNull().default(0), // ₹ it took off
	// Spend-more-save-more slab, frozen at order time (the owner can edit the slabs later).
	tierDiscount: integer("tier_discount").notNull().default(0),
	tierLabel: text("tier_label"), // wording the customer saw, e.g. "Spend ₹10,000+"
	source: text("source").notNull().default("website"),
});

export const coupons = sqliteTable("coupons", {
	code: text("code").primaryKey(),
	kind: text("kind").notNull(), // 'flat' | 'percent'
	value: integer("value").notNull(),
	maxDiscount: integer("max_discount").notNull().default(0),
	minOrder: integer("min_order").notNull().default(0),
	phone: text("phone"),
	customerName: text("customer_name"),
	maxUses: integer("max_uses").notNull().default(1),
	active: integer("active").notNull().default(1),
	expiresAt: integer("expires_at"),
	createdAt: integer("created_at").notNull(),
	note: text("note"),
	fromOrder: text("from_order"),
});

export type OrderRow = typeof orders.$inferSelect;

export const ORDER_STATUSES = [
	"pending_payment",
	"pending_verification",
	"verified",
	"confirmed",
	"packing",
	"ready",
	"dispatched",
	"delivered",
	"cancelled",
	"rejected",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
	pending_payment: "Pending payment",
	pending_verification: "Pending verification",
	verified: "Payment verified",
	confirmed: "Confirmed",
	packing: "Packing",
	ready: "Ready",
	dispatched: "Dispatched",
	delivered: "Delivered",
	cancelled: "Cancelled",
	rejected: "Rejected",
};

/** Statuses that count as "in processing" for the dashboard. */
export const PROCESSING_STATUSES: OrderStatus[] = ["confirmed", "packing", "ready", "dispatched"];

export function getDb() {
	const { env } = getCloudflareContext();
	if (!env.DB) throw new Error("D1 binding 'DB' is not configured.");
	return drizzle(env.DB, { schema: { orders, coupons } });
}

export type OrderItem = {
	id: string;
	name: string;
	content: string;
	qty: number;
	unit: number;
	total: number;
	line?: string;
};

export function parseItems(json: string): OrderItem[] {
	try {
		return JSON.parse(json) as OrderItem[];
	} catch {
		return [];
	}
}

/* ---- queries ---- */

export async function listOrders(limit = 100): Promise<OrderRow[]> {
	return getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function getOrder(id: string): Promise<OrderRow | undefined> {
	const rows = await getDb().select().from(orders).where(eq(orders.id, id)).limit(1);
	return rows[0];
}

export async function updateOrder(
	id: string,
	fields: Partial<Pick<OrderRow, "status" | "paymentRef" | "adminNote" | "utr">>,
): Promise<void> {
	await getDb().update(orders).set(fields).where(eq(orders.id, id));
}

/** Permanently delete an order and all order-related records from the database. */
export async function deleteOrder(id: string): Promise<void> {
	const db = getDb();
	await db.delete(coupons).where(eq(coupons.fromOrder, id));
	await db.delete(orders).where(eq(orders.id, id));
}

export function statusCounts(rows: OrderRow[]): Record<string, number> {
	const c: Record<string, number> = {};
	for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
	return c;
}

/** Order code like FW202612345 (FW + year + 5 digits). */
export function newOrderId(year: number): string {
	const digits = crypto.getRandomValues(new Uint8Array(5));
	let s = "";
	for (let i = 0; i < 5; i++) s += String(digits[i] % 10);
	return `FW${year}${s}`;
}
