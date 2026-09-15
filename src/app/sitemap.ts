import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getCatalog } from "@/lib/catalog";

/**
 * XML sitemap — submit this to Google Search Console + Bing Webmaster Tools.
 * Includes every active product's own page (added 2026-08-20 — before this,
 * the sitemap only listed 5 URLs total and Google had no per-SKU page to
 * index at all, found in the 2026-08-19 SEO audit).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
		{ path: "/", priority: 1.0, freq: "daily" },
		{ path: "/products", priority: 0.9, freq: "daily" },
		{ path: "/about", priority: 0.6, freq: "monthly" },
		{ path: "/faq", priority: 0.6, freq: "monthly" },
		{ path: "/contact", priority: 0.7, freq: "monthly" },
	];
	const now = new Date();
	const staticEntries = pages.map((p) => ({
		url: absoluteUrl(p.path),
		lastModified: now,
		changeFrequency: p.freq,
		priority: p.priority,
	}));

	const catalog = await getCatalog().catch(() => null);
	const productEntries = (catalog?.products ?? [])
		.filter((p) => p.active)
		.map((p) => ({
			url: absoluteUrl(`/products/${p.id}`),
			lastModified: now,
			changeFrequency: "weekly" as const,
			priority: 0.7,
		}));

	return [...staticEntries, ...productEntries];
}
