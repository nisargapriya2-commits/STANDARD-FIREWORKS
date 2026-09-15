/**
 * Shared class strings for the admin panel — a friendly, LIGHT theme for a
 * non-technical shop owner. Reuses the public site's warm brand tokens
 * (brand = royal maroon, ink = warm text, line/row = soft warm surfaces) so
 * the owner's screen feels like part of the same shop, not a dev tool.
 * Big text, big tap targets, high contrast, plain language everywhere.
 */

// Section card (a titled group of fields)
export const aCard =
	"rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6";

// Card heading (icon + title)
export const aCardTitle =
	"mb-1 flex items-center gap-2 text-[18px] font-bold text-brand";

// Small helper line under a card title
export const aCardSub = "mb-4 text-[14px] text-muted";

// Field label
export const aLabel = "block text-[15px] font-semibold text-ink";

// Helper hint under a field (plain-language "what is this")
export const aHint = "mt-1 text-[13.5px] leading-5 text-muted";

// Text input / textarea
export const aInput =
	"mt-1 w-full rounded-lg border border-line bg-white px-4 py-3 text-[16px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

// Primary button (Save)
export const aBtn =
	"inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-7 py-3.5 text-[16px] font-bold text-white shadow-sm transition hover:brightness-110 active:scale-[.99]";

// Secondary / ghost button
export const aBtnGhost =
	"inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-[15px] font-semibold text-ink transition hover:bg-row";

// Page title (top of each admin page)
export const aPageTitle = "text-[26px] font-extrabold text-ink";

// Green "saved!" success banner
export const aSuccess =
	"mb-5 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-[15px] font-semibold text-emerald-800";
