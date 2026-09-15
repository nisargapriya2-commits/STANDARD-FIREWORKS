import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		// Must stay comfortably above uploadPriceListPdfAction's own 1.4MB check
		// (src/app/admin/settings/actions.ts) — a raw PDF that check would reject
		// still needs to reach the action to show its friendly "too large" message.
		// At 2mb, a real client PDF (2.36MB) got rejected by this framework-level
		// limit *before* reaching that check, crashing with a generic error page
		// instead (found 2026-08-20).
		// Allow up to 10mb for multi-page client price list PDFs
		serverActions: { bodySizeLimit: "10mb" },
	},
	// Canonicalize on the apex domain. `standardfireworkssivakasi.com` and
	// `www.standardfireworkssivakasi.com` are both wired as Cloudflare custom
	// domains to this same Worker with no redirect between them — Search
	// Console was indexing every page twice, once per host (2026-08-19 SEO
	// audit). A `proxy.ts` (Next 16's renamed Middleware) can't do this: as of
	// Next 16 it defaults to the Node.js runtime and its `runtime` config
	// option can't be overridden, but OpenNext's Cloudflare adapter only
	// supports Edge-runtime proxy — confirmed by a real local preview build
	// failing with "Node.js middleware is not currently supported." This
	// `redirects()` config is resolved into the routing manifest at build
	// time instead, so it needs no runtime at all.
	async redirects() {
		return [
			{
				source: "/:path*",
				has: [{ type: "host", value: "www.standardfireworkssivakasi.com" }],
				destination: "https://standardfireworkssivakasi.com/:path*",
				permanent: true,
			},
		];
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
