/**
 * SEO helpers — target keywords, canonical URL builder, and JSON-LD schema
 * builders (LocalBusiness, WebSite, FAQ, Breadcrumbs). Kept in one place so the
 * whole site's structured data stays consistent and easy to update.
 *
 * Ranking strategy: this is a LOCAL firecracker dealer (Sivakasi stock, sold to
 * Chennai + South India). We rank on local + product + seasonal intent, not on
 * "buy online" (illegal for crackers — the site is enquiry/price-list only).
 */

import { SITE, type PublicSite } from "@/lib/site";

/** Primary + secondary keywords we target across the site. */
export const SEO_KEYWORDS = [
	"Sivakasi crackers",
	"Sivakasi crackers Chennai",
	"crackers wholesale Chennai",
	"crackers price list 2026",
	"Standard Fireworks Sivakasi",
	"Diwali crackers Chennai",
	"Deepavali crackers Sivakasi",
	"buy crackers online Chennai",
	"crackers gift box Sivakasi",
	"wholesale crackers price list",
	"green crackers Chennai",
	"fireworks Chennai",
	"crackers dealer Chennai",
	"crackers direct from Sivakasi",
	"Sivakasi crackers online price list",
];

/** Approx storefront location (Chennai) — matches the visible address. */
export const SITE_GEO = { latitude: 13.0827, longitude: 80.2707 };

/** Build an absolute URL on the live domain (for canonical + sitemap + schema). */
export function absoluteUrl(path = "/"): string {
	const base = SITE.domain.replace(/\/$/, "");
	return path === "/" ? base : `${base}${path.startsWith("/") ? path : "/" + path}`;
}

/** LocalBusiness / Store schema — the single biggest local-SEO signal. */
export function localBusinessJsonLd(s: PublicSite) {
	return {
		"@context": "https://schema.org",
		"@type": "Store",
		"@id": absoluteUrl("/") + "#store",
		name: SITE.name,
		alternateName: s.legalName || undefined,
		description:
			"Sivakasi crackers dealer selling direct at wholesale rates to families across Chennai and South India. Enquiry and price list only — no online payment.",
		url: absoluteUrl("/"),
		telephone: s.phone,
		email: s.email,
		image: absoluteUrl("/brand-logo.png"),
		logo: absoluteUrl("/brand-logo.png"),
		priceRange: "₹₹",
		address: {
			"@type": "PostalAddress",
			streetAddress: s.addressLine,
			addressLocality: "Chennai",
			addressRegion: "Tamil Nadu",
			addressCountry: "IN",
		},
		geo: {
			"@type": "GeoCoordinates",
			latitude: SITE_GEO.latitude,
			longitude: SITE_GEO.longitude,
		},
		openingHoursSpecification: [
			{
				"@type": "OpeningHoursSpecification",
				dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
				opens: "10:00",
				closes: "20:00",
			},
		],
		areaServed: s.serviceStates.map((st) => ({ "@type": "State", name: st })),
		sameAs: [s.instagram, s.facebook, s.youtube].filter(Boolean),
	};
}

/** WebSite schema — helps search engines understand the site + name. */
export function websiteJsonLd() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": absoluteUrl("/") + "#website",
		name: SITE.name,
		url: absoluteUrl("/"),
		inLanguage: "en-IN",
	};
}

/** FAQPage schema — can win the expandable FAQ rich result on Google/Bing. */
export function faqJsonLd(items: { q: string; a: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: items.map((it) => ({
			"@type": "Question",
			name: it.q,
			acceptedAnswer: { "@type": "Answer", text: it.a },
		})),
	};
}

/**
 * Product schema for one price-list item — the single biggest lever from the
 * 2026-08-19 SEO audit: every product used to live only as a `#hash` anchor
 * inside one `/products` page, so Google had no per-SKU URL to index or rank
 * at all. `availability` follows the same rule the price-list table already
 * uses (`stock === 0` → out of stock); a priced-TBC item is still "in stock"
 * since it can be ordered, just not at a confirmed rate yet.
 */
export function productJsonLd(p: {
	id: string;
	name: string;
	content: string;
	price: number;
	mrp: number;
	image: string;
	categoryName: string;
	inStock: boolean;
}) {
	return {
		"@context": "https://schema.org",
		"@type": "Product",
		name: p.name,
		description: `${p.name}${p.content ? ` — ${p.content}` : ""}, from the ${p.categoryName} range. Sivakasi crackers sold direct to Chennai & South India at wholesale rates.`,
		category: p.categoryName,
		image: p.image ? absoluteUrl(p.image) : undefined,
		url: absoluteUrl(`/products/${p.id}`),
		brand: { "@type": "Brand", name: SITE.name },
		...(p.price > 0
			? {
					offers: {
						"@type": "Offer",
						url: absoluteUrl(`/products/${p.id}`),
						priceCurrency: "INR",
						price: p.price,
						availability: p.inStock
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						itemCondition: "https://schema.org/NewCondition",
					},
				}
			: {}),
	};
}

/** BreadcrumbList schema for an inner page. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
	return {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: trail.map((t, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: t.name,
			item: absoluteUrl(t.path),
		})),
	};
}
