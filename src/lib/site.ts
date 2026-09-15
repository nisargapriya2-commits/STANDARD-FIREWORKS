/**
 * Sivakasi Standard Fireworks — single source of truth for client details.
 *
 * These are the CODE-LEVEL defaults (name, domain, seed contact info). Almost
 * everything the owner needs to change is editable at runtime from /admin
 * (see the `Settings` type below) — those overrides win over these defaults.
 * Any value still unconfirmed by the client is listed in PLACEHOLDER-DATA.md.
 */

import type { OrderStatus } from "@/lib/db";

export const SITE = {
  name: "Standard Fireworks",
  shortName: "STANDARD FIREWORKS",
  // The registered trading firm behind the brand — shown small in the footer.
  legalName: "Murugan Traders",
  tagline: "Crackers direct from Sivakasi",

  // ---- CONTACT ----
  phone: "+91 93441 70018",
  whatsapp: "919344170018", // digits only, country code, no + and no spaces
  email: "standardfireworkssivakasi5@gmail.com",
  address: {
    // City-level only. Matches addressLocality/geo in lib/seo.ts's LocalBusiness schema.
    line1: "Chennai, Tamil Nadu",
  },
  hours: "Mon–Sun · 10:00 AM – 8:00 PM",

  // ---- BUSINESS ----
  gst: "", // client said N/A — "" hides the row
  licence: "", // client said N/A — "" hides the row
  minOrder: 3000,
  discountPct: 50,

  // ---- ⚠️ PRICE STATE — the most important switch on the site ----
  // TRUE while the catalogue holds PLACEHOLDER prices (generated for demo and for
  // testing the discount slabs — they are NOT the client's real rates).
  // While true the site is `noindex` and every price-bearing page shows a visible
  // "indicative prices" notice, so no customer can order at an invented rate and
  // Google never caches a fake price list.
  // 👉 Flip to FALSE the moment the client's real prices are loaded, then redeploy.
  pricesAreProvisional: false,

  // ---- SPEND-BASED EXTRA DISCOUNT SLABS (shown on the hero banner) ----
  // ⚠️ Placeholder percentages — CLIENT to confirm the real slabs.
  // Spend at least `min` (in ₹) → get `extra`% off ON TOP of the base discount.
  discountTiers: [
    { min: 5000, extra: 2, label: "Spend ₹5,000+" },
    { min: 7000, extra: 4, label: "Spend ₹7,000+" },
    { min: 10000, extra: 6, label: "Spend ₹10,000+" },
  ],

  // ---- PAYMENT (❗ dummy) ----
  // Shown for MANUAL transfer only. There is no payment gateway on this site — by law.
  bank: {
    name: "<Bank name>",
    branch: "<Branch>",
    account: "0000 0000 0000",
    ifsc: "XXXX0000000",
    holder: "<Account holder>",
  },
  upi: "example@upi",
  // Path to the UPI QR image in /public (client to provide). "" → a placeholder box is shown.
  upiQr: "",

  // ---- SOCIAL ("" hides the icon) ----
  facebook: "",
  instagram: "",
  youtube: "",

  // ---- DELIVERY — keep honest, only what their transporter really serves ----
  serviceStates: [
    "Tamil Nadu",
    "Puducherry",
    "Kerala",
    "Karnataka",
    "Andhra Pradesh",
    "Telangana",
  ],

  // ---- BRAND ----
  // ⚠️ Only fill AFTER the client confirms in writing that they may advertise
  // this brand name. They buy wholesale from Standard Fireworks, but being a
  // customer of a brand is not a licence to use its name. "" hides it.
  stockistOf: "",

  // ---- DOMAIN (registered at Hostinger; DNS to be pointed to the Worker at deploy) ----
  domain: "https://standardfireworkssivakasi.com",

  // ---- SEARCH-ENGINE VERIFICATION (paste tokens after registering; "" = not rendered) ----
  // Google Search Console → Settings → Ownership → HTML tag → the content="..." value.
  googleVerification: "A045bXtLodiQlyMnWxsoB9U0DjZ45RYHrrMdsLGF0Sg",
  // Bing Webmaster Tools → verify via meta tag → the content="..." value (msvalidate.01).
  bingVerification: "",
  // Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)
  gaMeasurementId: "G-FP60JY2PQR",
} as const;

export const money = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

export const sellPrice = (listPrice: number) =>
  Math.round((listPrice * (100 - SITE.discountPct)) / 100);

/**
 * Editable-at-runtime settings (overridable from the admin panel → D1).
 * Everything else in SITE is code-level. Defaults come from SITE.
 */
export type DiscountTier = { min: number; extra: number; label: string };

/** Replaces `{token}` placeholders with plain text — unknown tokens become "". Client-safe (no server deps), so both the settings page's live preview and lib/email.ts share this one implementation. */
export function fillTemplate(template: string, vars: Record<string, string>): string {
	return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/** Tokens the owner can use inside a custom subject or message — see fillTemplate() above. */
export const EMAIL_TEMPLATE_TOKENS = [
	{ token: "{name}", meaning: "Customer's first name" },
	{ token: "{orderId}", meaning: "Order number, e.g. FW202612345" },
	{ token: "{area}", meaning: "Delivery area (blank if none was picked)" },
	{ token: "{city}", meaning: "Delivery city" },
	{ token: "{areaMap}", meaning: "Google Maps link for the delivery point (blank if none)" },
	{ token: "{shopName}", meaning: "Your shop's name" },
	{ token: "{statusLabel}", meaning: "The status in plain words, e.g. \"Dispatched\"" },
] as const;

export type EmailTemplate = { subject?: string; body?: string };

/**
 * What each status currently emails, shown as placeholder text (not a saved
 * value) in Admin → Settings → "Customer email wording" — so the owner can see
 * what's already going out before deciding whether to change it. Mirrors the
 * built-in defaults in lib/email.ts statusEmail(); update both together.
 */
export const EMAIL_TEMPLATE_DEFAULTS: Partial<Record<OrderStatus, Required<EmailTemplate>>> = {
	pending_payment: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "we've received your order {orderId} — the invoice is attached. Please complete the payment and share the receipt; we'll verify it and keep you updated as your order moves through each stage.",
	},
	pending_verification: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "we've received your order {orderId}. Please complete the payment and share the receipt so we can confirm it.",
	},
	verified: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "your payment for order {orderId} is verified. Your order is confirmed and we'll start preparing it.",
	},
	confirmed: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "your order {orderId} is confirmed. We'll update you as we pack and dispatch it.",
	},
	packing: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "your order {orderId} is being packed.",
	},
	ready: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "your order {orderId} is packed and ready to dispatch.",
	},
	dispatched: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "good news — order {orderId} has been dispatched. Collect it from the {area} delivery point ({city}). Location on Google Maps: {areaMap}",
	},
	delivered: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "hope you received order {orderId} safely. Have a safe and happy Deepavali!",
	},
	rejected: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "we couldn't verify the payment for order {orderId}. Please reply with your payment details and we'll help.",
	},
	cancelled: {
		subject: "{shopName} · Order {orderId} — {statusLabel}",
		body: "your order {orderId} has been cancelled. Reply if you have any questions.",
	},
};

/**
 * Level 3 of the delivery hierarchy: State → City → Area.
 * An area is the actual delivery/collection point inside a city (e.g. "Anna Nagar"
 * inside Chennai). `mapUrl` is the Google Maps link the owner pastes in /admin —
 * it is shown to the customer at checkout and emailed on dispatch. "" = no link.
 */
export type ServiceArea = {
  name: string; // Delivery point / hub name, e.g. "Chennai (Velappanchavadi HUB)"
  address?: string; // Street address / landmark, e.g. "#142, Poonamallee High Road"
  pincode?: string; // Supporting postal code, e.g. "600077"
  mapUrl: string; // Google Maps link
};

/**
 * Formats an area for dropdown display and order recording in the SriKrishna style:
 * e.g. "Chennai (Velappanchavadi HUB) — #142, Poonamallee High Road"
 * or "Chennai (Koyambedu) — #1169, P.H Road"
 */
export function formatAreaDisplay(area: ServiceArea | string, city?: string): string {
  if (typeof area === "string") return area;
  if (!area) return "";

  const name = (area.name || "").trim();
  const address = (area.address || "").trim();

  if (!address) return name;

  // Avoid repeating address if already contained in name
  if (name.toLowerCase().includes(address.toLowerCase())) {
    return name;
  }

  return `${name} — ${address}`;
}

/** Key used for `Settings.serviceAreas` — areas belong to a (state, city) pair. */
export const areaKey = (state: string, city: string) => `${state}::${city}`;

/** Areas the owner has listed for a city, or [] when they haven't added any yet. */
export const areasFor = (
  serviceAreas: Record<string, ServiceArea[]>,
  state: string,
  city: string,
): ServiceArea[] => (state && city ? serviceAreas[areaKey(state, city)] ?? [] : []);

/**
 * Normalise a pasted map link. Owners paste anything — a full
 * https://maps.app.goo.gl/... link, or just "maps.app.goo.gl/xyz". Anything that
 * isn't a usable web link is dropped so we never render a broken/unsafe href.
 */
/**
 * A payment-receipt screenshot is uploaded by an ANONYMOUS customer and is later
 * rendered in the admin panel as both <img src> and <a href>. Without this check
 * a crafted request could store `javascript:…`, which would then run in the
 * owner's admin session the moment he clicks the receipt. Only inline image data
 * is ever accepted.
 */
export function isSafeImageDataUrl(v: string): boolean {
  return /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(v.trim());
}

export function cleanMapUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.-]+\.[a-z]{2,}\//i.test(v)) return `https://${v}`;
  return "";
}

export type Settings = {
  phone: string;
  whatsapp: string;
  email: string;
  upi: string;
  upiQr: string;
  minOrder: number;
  discountPct: number;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  bankIfsc: string;
  bankHolder: string;
  serviceStates: string[];
  // Per-state transport fee (₹) auto-added at checkout. Missing state → not serviceable.
  transportFees: Record<string, number>;
  // Serviceable cities per state (checkout city is a dropdown of these).
  serviceCities: Record<string, string[]>;
  // Areas/localities per city — keyed by `areaKey(state, city)`. Third dropdown at
  // checkout; each area carries its own Google Maps link. Missing/empty → the
  // area step is skipped for that city.
  serviceAreas: Record<string, ServiceArea[]>;
  // GST percentage applied at checkout. 0 = no GST line shown.
  gstPct: number;
  // Whether a UTR (transaction id) is required on the payment-confirmation step.
  requireUtr: boolean;
  // SEO
  metaTitle: string;
  metaDescription: string;
  gaId: string;
  // Logo (data URL uploaded from admin). "" = built-in brand mark.
  logo: string;
  // Scrolling announcement bar under the hero (season/offer message).
  announcement: string;
  // Live countdown shown inside that same scrolling bar. "" date → hidden.
  // The owner updates this every season (the festival date moves every year
  // on the lunar calendar) — Admin → Settings → Announcement banner.
  festivalName: string;
  festivalDate: string; // "YYYY-MM-DD"

  // ---- Business identity / content (all owner-editable) ----
  tagline: string;
  hours: string;
  addressLine: string;
  legalName: string;
  gstNumber: string; // GSTIN shown in footer/contact ("" hides it)
  licence: string; // explosives licence no. ("" hides it)
  stockistOf: string; // brand name, only if allowed ("" hides)
  aboutStory: string; // About-page story, paragraphs split on blank lines
  // Spend-more-save-more slabs shown on the hero.
  discountTiers: DiscountTier[];
  // Social links ("" hides the icon).
  facebook: string;
  instagram: string;
  youtube: string;
  // Owner's own wording for the automatic customer status-update email, per
  // order status. Missing/blank status → the built-in default message is used.
  // See EMAIL_TEMPLATE_TOKENS for what can go inside one.
  emailTemplates: Partial<Record<OrderStatus, EmailTemplate>>;
};

// ⚠️ Placeholder transport fees + cities — the client sets the real ones in /admin/settings.
const DEFAULT_TRANSPORT: Record<string, number> = {
  "Tamil Nadu": 150,
  Puducherry: 150,
  Kerala: 250,
  Karnataka: 250,
  "Andhra Pradesh": 250,
  Telangana: 300,
};

const DEFAULT_CITIES: Record<string, string[]> = {
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Erode", "Tirunelveli"],
  Puducherry: ["Puducherry"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  Karnataka: ["Bengaluru", "Mysuru", "Hubli"],
  "Andhra Pradesh": ["Vijayawada", "Visakhapatnam", "Tirupati", "Nellore"],
  Telangana: ["Hyderabad", "Warangal"],
};

export const DEFAULT_SETTINGS: Settings = {
  phone: SITE.phone,
  whatsapp: SITE.whatsapp,
  email: SITE.email,
  upi: SITE.upi,
  upiQr: SITE.upiQr,
  minOrder: SITE.minOrder,
  discountPct: SITE.discountPct,
  bankName: SITE.bank.name,
  bankBranch: SITE.bank.branch,
  bankAccount: SITE.bank.account,
  bankIfsc: SITE.bank.ifsc,
  bankHolder: SITE.bank.holder,
  serviceStates: [...SITE.serviceStates],
  transportFees: DEFAULT_TRANSPORT,
  serviceCities: DEFAULT_CITIES,
  // Empty on purpose — an area is useless without the owner's REAL Google Maps
  // pin, so they add these in /admin → Settings → "Delivery charge & places".
  serviceAreas: {},
  gstPct: 0, // off by default — client enables (e.g. 18) in admin if invoicing GST
  requireUtr: true,
  metaTitle: `${SITE.name} — Sivakasi Wholesale Crackers Price List`,
  metaDescription:
    "Buy Sivakasi crackers at wholesale rates. Browse our 2026 Standard Fireworks price list and build your festive order with direct delivery across South India.",
  gaId: "G-FP60JY2PQR",
  logo: "",
  announcement:
    "BOOKING OPEN FOR DEEPAVALI 2026 · BOOK EARLY FOR BEST STOCK · FREE TRANSPORT-OFFICE DELIVERY ACROSS SOUTH INDIA",
  // Deepavali 2026 (Lakshmi Puja) is Sunday, 8 November 2026 — confirmed against
  // multiple calendar sources. The owner can change this from Admin next season.
  festivalName: "Deepavali",
  festivalDate: "2026-11-08",

  tagline: SITE.tagline,
  hours: SITE.hours,
  addressLine: SITE.address.line1,
  legalName: SITE.legalName,
  gstNumber: SITE.gst,
  licence: SITE.licence,
  stockistOf: SITE.stockistOf,
  aboutStory:
    "Murugan Traders has been in the fireworks trade for over 12 years. What began as a small seasonal stall — a few boxes brought up from Sivakasi each Deepavali — has grown, one honest order at a time, into a business that families across Chennai come back to every year.\n\n" +
    "We buy wholesale straight from established Sivakasi manufacturers and sell direct — to families, temples, schools and function organisers. No showroom rent, no salesmen, no commission agents. That is the whole reason our rate is what it is.\n\n" +
    "Twelve years on, the promise hasn't changed: the same crackers the big shops sell, at the price we buy them for — and a real person on the other end of the phone.",
  discountTiers: SITE.discountTiers.map((t) => ({ ...t })),
  facebook: SITE.facebook,
  instagram: SITE.instagram,
  youtube: SITE.youtube,
  emailTemplates: {},
};

/**
 * Live, owner-editable view of the site content. Merges the fixed structural
 * bits from SITE (name, domain) with everything the owner edits in /admin.
 * Public pages/components consume THIS (via getSettings), so admin edits show
 * up immediately on the live site.
 */
export function publicSite(s: Settings, logoUrl = "", priceListPdfUrl = "") {
  return {
    name: SITE.name,
    shortName: SITE.shortName,
    domain: SITE.domain,
    // Owner-uploaded logo (from /admin/photos). "" → the built-in brand-logo.png.
    logo: logoUrl,
    // Owner-uploaded price list PDF (from /admin/settings). "" → the header's
    // "Price List" button falls back to the /products page instead of a download.
    priceListPdfUrl,
    tagline: s.tagline,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    hours: s.hours,
    addressLine: s.addressLine,
    legalName: s.legalName,
    gst: s.gstNumber,
    licence: s.licence,
    stockistOf: s.stockistOf,
    minOrder: s.minOrder,
    discountPct: s.discountPct,
    discountTiers: s.discountTiers,
    serviceStates: s.serviceStates,
    bank: {
      name: s.bankName,
      branch: s.bankBranch,
      account: s.bankAccount,
      ifsc: s.bankIfsc,
      holder: s.bankHolder,
    },
    upi: s.upi,
    upiQr: s.upiQr,
    facebook: s.facebook,
    instagram: s.instagram,
    youtube: s.youtube,
    aboutStory: s.aboutStory,
    announcement: s.announcement,
    festivalName: s.festivalName,
    festivalDate: s.festivalDate,
  };
}
export type PublicSite = ReturnType<typeof publicSite>;

/** GST amount for a subtotal at the given rate. */
export const gstAmount = (subtotal: number, pct: number) =>
  pct > 0 ? Math.round((subtotal * pct) / 100) : 0;

/**
 * Spend-more-save-more: the best slab a product subtotal qualifies for, or null.
 *
 * The hero advertises these ("Spend ₹10,000+ → +6% extra off"), so checkout MUST
 * honour them — for a long time it advertised them and didn't, which meant the
 * site promised a discount it never gave.
 *
 * Highest qualifying `min` wins; slabs are not stacked. `extra` is a percentage
 * ON TOP of the base list discount that is already baked into `product.price`.
 */
export function bestTier(subtotal: number, tiers: DiscountTier[]): DiscountTier | null {
  let best: DiscountTier | null = null;
  for (const t of tiers) {
    if (t.min > 0 && t.extra > 0 && subtotal >= t.min && (!best || t.min > best.min)) best = t;
  }
  return best;
}

/**
 * ₹ taken off by the spend slab. Computed on the PRODUCT SUBTOTAL only — never on
 * transport (we don't subsidise the lorry) and never compounded with the coupon:
 * both this and a discount code are worked out from the same pre-discount subtotal
 * and then added together, so the customer can predict the number and the owner
 * can explain it on the phone.
 */
export const tierDiscount = (subtotal: number, tiers: DiscountTier[]): number => {
  const t = bestTier(subtotal, tiers);
  return t ? Math.round((subtotal * t.extra) / 100) : 0;
};

export const waLinkTo = (whatsapp: string, message: string) =>
  `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;

export const waLink = (message: string) =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;

export const telLink = () => "tel:" + SITE.phone.replace(/\s/g, "");

export const telLinkTo = (phone: string) => "tel:" + phone.replace(/\s/g, "");
