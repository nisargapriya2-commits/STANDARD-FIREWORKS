/**
 * Compatibility shim.
 *
 * The live catalogue now lives in D1 (see `catalog.ts` for server access and
 * `catalog-types.ts` for the shared types). This file only provides the small
 * static category list used by the home-page + footer showcases, derived from
 * the seed so it always matches the real category set. Client-safe (pure data).
 */

import { SEED_CATEGORIES } from "@/lib/seed-data";

export { LINES, categoriesByLine } from "@/lib/catalog-types";
export type { LineId, Line, CatCategory, CatProduct } from "@/lib/catalog-types";

/** Display categories for showcases — one line's set covers all product types. */
export const CATEGORIES = SEED_CATEGORIES.filter((c) => c.line === "standard").map((c) => ({
	id: c.id,
	name: c.name,
}));
