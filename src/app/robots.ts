import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * robots.txt — let search engines crawl everything except the admin + API.
 *
 * ⚠️ Crawling stays ALLOWED even while `SITE.pricesAreProvisional` is true, and that
 * is deliberate. Keeping placeholder prices out of Google is the job of the
 * `noindex` meta tag in layout.tsx — and Googlebot can only obey `noindex` on a
 * page it is allowed to FETCH. A blanket `Disallow: /` here would hide the very
 * tag that does the work, and Google can still index a blocked URL it finds from
 * an external link. Blocking would also break Search Console's HTML-tag
 * verification, which fetches the home page to read the token.
 *
 * So: robots.txt = "you may look", noindex meta = "do not list this". Both are
 * needed, and only the second one flips with the price flag.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/admin", "/admin/", "/api/"],
			},
		],
		sitemap: absoluteUrl("/sitemap.xml"),
		host: absoluteUrl("/"),
	};
}
