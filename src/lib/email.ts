/**
 * Email helpers (Resend). Replaces the old Meta WhatsApp automation — every
 * automated/owner/customer notification now goes over email instead.
 *
 * Two modes (mirrors how WhatsApp used to work):
 *  - MAILTO LINK (always available): build a `mailto:` link the owner clicks to
 *    email a customer from their own mail client. Free, no setup.
 *  - RESEND API (auto-send): once RESEND_API_KEY + EMAIL_FROM are set,
 *    sendEmail() auto-notifies on new orders / status changes.
 *    Until then emailConfigured() is false and the UI falls back to the mailto link.
 *
 * Resend is a pure HTTPS API (fetch) — it runs unchanged on Cloudflare Workers,
 * unlike SMTP. `EMAIL_FROM` must be an address on a Resend-verified domain.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SITE, fillTemplate, type EmailTemplate } from "@/lib/site";
import { STATUS_LABEL, type OrderRow, type OrderStatus } from "@/lib/db";

function env() {
	try {
		const cf = getCloudflareContext();
		if (cf?.env) {
			const e = cf.env as unknown as {
				RESEND_API_KEY?: string;
				EMAIL_FROM?: string;
				OWNER_EMAIL?: string;
			};
			return {
				RESEND_API_KEY: e.RESEND_API_KEY || process.env.RESEND_API_KEY,
				EMAIL_FROM: e.EMAIL_FROM || process.env.EMAIL_FROM,
				OWNER_EMAIL: e.OWNER_EMAIL || process.env.OWNER_EMAIL,
			};
		}
	} catch {
		// Not in Cloudflare request context
	}
	return {
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		EMAIL_FROM: process.env.EMAIL_FROM,
		OWNER_EMAIL: process.env.OWNER_EMAIL,
	};
}

/** Owner's inbox — where new-order / payment notifications land. */
export function ownerEmail(): string {
	return env().OWNER_EMAIL || SITE.email;
}

export function emailConfigured(): boolean {
	const e = env();
	return Boolean(e.RESEND_API_KEY && e.EMAIL_FROM);
}

/** A `mailto:` deep link (free, always works — the owner sends from their mail client). */
export function customerMailLink(to: string, subject: string, body: string): string {
	const q = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	return `mailto:${encodeURIComponent(to)}?${q}`;
}

/**
 * Opens a Gmail compose draft in the browser (view=cm) instead of relying on
 * an OS-registered mail app — mailto: links only work if the device has a
 * desktop mail client set as default, which most people don't. This always
 * works as long as the owner is logged into Gmail, and matches how they
 * actually check/send: review in Gmail, then attach the invoice PDF by hand
 * (Gmail can't auto-attach a file dropped from a browser download either).
 */
export function gmailComposeLink(to: string, subject: string, body: string): string {
	const q = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
	return `https://mail.google.com/mail/?${q.toString()}`;
}

/**
 * Friendly, per-status update for a customer. `templates` is the owner's own
 * wording (Admin → Settings → "Customer email wording") — when the current
 * status has a subject/body set, it wins over the built-in default below, with
 * `{token}` placeholders filled in first. Blank/missing → built-in default.
 */
export function statusEmail(
	order: Pick<OrderRow, "id" | "customerName" | "status" | "area" | "city" | "areaMap">,
	templates: Partial<Record<OrderStatus, EmailTemplate>> = {},
): { subject: string; text: string } {
	const name = order.customerName.split(" ")[0] || "there";
	const from = `— ${SITE.name}`;
	const s = order.status as OrderStatus;
	const vars = {
		name,
		orderId: order.id,
		area: order.area || "",
		city: order.city || "",
		areaMap: order.areaMap || "",
		shopName: SITE.name,
		statusLabel: STATUS_LABEL[s],
	};

	const tpl = templates[s];
	const subject = tpl?.subject?.trim()
		? fillTemplate(tpl.subject, vars)
		: `${SITE.name} · Order ${order.id} — ${STATUS_LABEL[s]}`;

	const customBody = tpl?.body?.trim();
	if (customBody) {
		const line = fillTemplate(customBody, vars);
		return { subject, text: `Hi ${name}, ${line}\n\n${from}` };
	}

	let line: string;
	switch (s) {
		case "pending_payment":
			line =
				`we've received your order ${order.id} — the invoice is attached. Please complete the payment ` +
				`and share the receipt; we'll verify it and keep you updated as your order moves through each stage.`;
			break;
		case "verified":
			line = `your payment for order ${order.id} is verified ✅. Your order is confirmed and we'll start preparing it.`;
			break;
		case "confirmed":
			line = `your order ${order.id} is confirmed 🎆. We'll update you as we pack and dispatch it.`;
			break;
		case "packing":
			line = `your order ${order.id} is being packed 📦.`;
			break;
		case "ready":
			line = `your order ${order.id} is packed and ready to dispatch.`;
			break;
		case "dispatched":
			// The customer picked an area at checkout — send them straight to its map pin.
			line = order.area
				? `good news — order ${order.id} has been dispatched 🚚. Collect it from the ${order.area} delivery point (${order.city}).` +
					(order.areaMap ? `\n\nLocation on Google Maps: ${order.areaMap}` : "")
				: `good news — order ${order.id} has been dispatched 🚚. Collect it from your nearest transport office; we'll share the details.`;
			break;
		case "delivered":
			line = `hope you received order ${order.id} safely. Have a safe and happy Deepavali! 🎆`;
			break;
		case "rejected":
			line = `we couldn't verify the payment for order ${order.id}. Please reply with your payment details and we'll help.`;
			break;
		case "cancelled":
			line = `your order ${order.id} has been cancelled. Reply if you have any questions.`;
			break;
		default:
			line = `we've received your order ${order.id}. Please complete the payment and share the receipt so we can confirm it.`;
	}
	return { subject, text: `Hi ${name}, ${line}\n\n${from}` };
}

/** Owner notification when a new order / payment comes in. */
export function ownerOrderEmail(
	order: Pick<
		OrderRow,
		| "id"
		| "customerName"
		| "phone"
		| "city"
		| "state"
		| "area"
		| "areaMap"
		| "couponCode"
		| "couponDiscount"
		| "tierDiscount"
		| "tierLabel"
		| "itemCount"
		| "grandTotal"
		| "total"
		| "hasPrices"
	>,
	kind: "new" | "payment",
): { subject: string; text: string } {
	const amount = order.hasPrices ? `₹${order.grandTotal || order.total}` : "TBC";
	const subject =
		kind === "payment"
			? `💰 Payment submitted — order ${order.id} (${order.customerName})`
			: `🆕 New order ${order.id} — ${order.customerName}`;
	const text =
		`${kind === "payment" ? "A customer submitted a payment to verify." : "A new order was placed."}\n\n` +
		`Order: ${order.id}\n` +
		`Customer: ${order.customerName} (${order.phone})\n` +
		`Location: ${order.area ? `${order.area}, ` : ""}${order.city}, ${order.state}\n` +
		(order.areaMap ? `Delivery point map: ${order.areaMap}\n` : "") +
		`Items: ${order.itemCount}\n` +
		(order.tierDiscount
			? `Spend offer: ${order.tierLabel || "slab"} (−₹${order.tierDiscount})\n`
			: "") +
		(order.couponCode
			? `Discount code: ${order.couponCode} (−₹${order.couponDiscount})\n`
			: "") +
		`Amount: ${amount}\n\n` +
		`Open the admin panel to review it.`;
	return { subject, text };
}

/**
 * Send an email via the Resend HTTPS API. No-op (returns false) until
 * RESEND_API_KEY + EMAIL_FROM are configured. Pure fetch — runs on Cloudflare
 * Workers as-is. `EMAIL_FROM` must be on a Resend-verified domain.
 */
export async function sendEmail(opts: {
	to: string;
	subject: string;
	text: string;
	html?: string;
	replyTo?: string;
	/** Resend wants file content as base64 (no data: prefix). */
	attachments?: { filename: string; content: string }[];
}): Promise<boolean> {
	const e = env();
	if (!e.RESEND_API_KEY || !e.EMAIL_FROM) return false;
	if (!opts.to) return false;
	try {
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${e.RESEND_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from: e.EMAIL_FROM,
				to: [opts.to],
				subject: opts.subject,
				text: opts.text,
				...(opts.html ? { html: opts.html } : {}),
				...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
				...(opts.attachments?.length ? { attachments: opts.attachments } : {}),
			}),
		});
		if (!res.ok) {
			console.error("sendEmail: Resend returned", res.status, await res.text().catch(() => ""));
			return false;
		}
		return true;
	} catch (err) {
		console.error("sendEmail failed", err);
		return false;
	}
}

export { STATUS_LABEL };
