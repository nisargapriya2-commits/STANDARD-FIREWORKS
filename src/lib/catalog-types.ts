/**
 * Client-safe catalogue types + the LINES constant.
 * (No server imports here, so client components can import it freely.)
 */

export type LineId = "standard" | "elite";

export type Line = { id: LineId; name: string; sub: string };

export const LINES: Line[] = [
	{ id: "standard", name: "Standard", sub: "Standard products" },
	{ id: "elite", name: "Elite", sub: "Elite products" },
];

export type CatCategory = {
	id: string;
	line: LineId;
	name: string;
	/** Owner-uploaded category photo URL, or "" → the drawn icon is used instead. */
	image: string;
};

/**
 * Pictures that aren't attached to a product or a category.
 * `logo` is a single image; the others are lists the owner adds to.
 */
export const SITE_IMAGE_GROUPS = ["logo", "about", "banner"] as const;
export type SiteImageGroup = (typeof SITE_IMAGE_GROUPS)[number];

export type SiteImage = {
	id: string;
	group: SiteImageGroup;
	url: string;
	caption: string;
	sort: number;
};

export type CatProduct = {
	id: string;
	categoryId: string;
	line: LineId;
	name: string;
	content: string;
	mrp: number; // struck-through list price
	price: number; // actual selling price
	active: boolean;
	stock: number; // -1 = unlimited/untracked, 0 = out of stock, >0 = units left
	/**
	 * Public URL of the owner-uploaded photo, or "" when there is none (the category
	 * icon is drawn instead). This is a URL, never the image data — the bytes live in
	 * D1 and are served by /api/product-image/<id>.
	 */
	image: string;
};

/** Photo URL for a product, or "" if the owner hasn't uploaded one. */
export const productImageUrl = (id: string, imageV: number) =>
	imageV > 0 ? `/api/product-image/${encodeURIComponent(id)}?v=${imageV}` : "";

/** Photo URL for a category, or "" if the owner hasn't uploaded one. */
export const categoryImageUrl = (id: string, imageV: number) =>
	imageV > 0 ? `/api/category-image/${encodeURIComponent(id)}?v=${imageV}` : "";

/** URL for a logo / About / banner picture. */
export const siteImageUrl = (id: string, v: number) =>
	`/api/site-image/${encodeURIComponent(id)}?v=${v}`;

/** A product is orderable if active and not explicitly out of stock. */
export const inStock = (p: { active: boolean; stock: number }) => p.active && p.stock !== 0;

export type Catalog = {
	categories: CatCategory[];
	products: CatProduct[];
};

export const categoriesByLine = (categories: CatCategory[], line: LineId) =>
	categories.filter((c) => c.line === line);

/** Discount % for display, derived from mrp vs price. */
export const discountPctOf = (p: { mrp: number; price: number }) =>
	p.mrp > 0 && p.price > 0 ? Math.round((1 - p.price / p.mrp) * 100) : 0;
