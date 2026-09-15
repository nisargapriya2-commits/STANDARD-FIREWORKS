# Sivakasi Standard Fireworks — web app (Phase 2)

Next.js 16 (App Router) → **Cloudflare Workers** via `@opennextjs/cloudflare`.
Built by Fresh Frame · 2026-07-17

> ⚠️ **All data is DUMMY.** See `../WHAT-WE-NEED-FROM-CLIENT.md`.
> ⚖️ **Read `../../firecracker-company/LEGAL-CONSTRAINTS.md` before changing anything.**
> **No cart. No payment gateway. Ever.** It's barred for this product, and Razorpay/PayU
> ban fireworks as a merchant category regardless.

---

## Stack (verified working 2026-07-17)
| | |
|---|---|
| Next.js | 16.2.6 (Turbopack) |
| Adapter | `@opennextjs/cloudflare` 1.19.9 → **Workers** |
| React | 19.1.7 |
| Styling | Tailwind CSS **v4** |
| Wrangler | 4.111 |

✅ Verified: `next build` → 6/6 static routes · `opennextjs-cloudflare build` → `.open-next/worker.js`
· driven in real Chrome at 1280/768/390/360px, zero console errors.

❗ **Not Cloudflare Pages.** `@cloudflare/next-on-pages` is deprecated (repo archived 2025-09-29);
Workers + OpenNext is the current path.

⚠️ **Tailwind v4 gotcha:** the important modifier is a **suffix** (`bg-red!`), not a prefix
(`!bg-red`). v3-style `!` classes are silently ignored — this already bit us once.

---

## 🔍 How the reference site is built (checked 2026-07-17)
The client pointed at a competitor, `standardcrackers.com`. What it actually runs on:

| | |
|---|---|
| Host | **Hostinger** shared hosting (`platform: hostinger`, `panel: hpanel`) |
| Server | LiteSpeed |
| Language | **PHP 8.3.30** (`PHPSESSID`; URLs are `index.php`, `productlist.php`) |
| IP | 82.112.224.120 |
| DNS | `ns77/ns78.domaincontrol.com` → **GoDaddy** |
| Cloudflare | **No** — not proxied, not on CF DNS |
| MX | **none** — no email on that domain (they use a gmail address) |

**We deliberately did NOT copy this.** A PHP box on shared hosting costs monthly rent, has no CDN,
and rebuilds every page per request. Ours is static-prerendered on Cloudflare's edge, on the **free**
tier, and it survives the Deepavali traffic spike untouched. Their stack also couldn't do the admin
panel + WhatsApp automation the client asked for without real work.

**What we DID take:** the theme and structure — pulled from their live computed styles, not guessed:
- brand red `#e30513` · yellow `#ffed00` · gold `#eeca1c` · white page
- text `#212121` / `#333` · rows `#f9f9f9` / `#f8f8f8` · shell `#eee`
- font **Rubik**
- section order: topbar → brand bar → dark nav → hero banner → black strip → categories →
  2×2 promo grid → red feature band → black discount band → occasions → newsletter → red footer
  with bank details

**What we did NOT take (deliberate):** their photos, their logo, their copy text, their contact
details. Layout/theme aren't ownable — that red-and-gold cracker look is generic to the whole
Sivakasi trade — but images and copy are, and a direct competitor is the most likely party to
notice. The client would receive that letter, not us. All images here are placeholders sized for
the client's own photos.

---

## Run it
```bash
npm run dev        # next dev, http://localhost:3000
npm run build      # next build
npm start          # serve the production build

npm run preview    # ⭐ build + run in the REAL workerd runtime — test here before deploying
npm run deploy     # build + deploy to Cloudflare
npm run cf-typegen # regenerate cloudflare-env.d.ts after changing bindings
```

## Structure
```
src/
├── app/
│   ├── layout.tsx          Rubik font, Header, Footer, floating WhatsApp
│   ├── globals.css         ⭐ theme tokens (@theme) — brand red, yellow, Rubik
│   ├── page.tsx            Home
│   ├── products/           ⭐ price list + estimate builder
│   ├── gallery/ about/ faq/ contact/
├── components/
│   ├── Header.tsx          topbar + brand bar + STICKY nav
│   ├── Footer.tsx          bank details, links, legal
│   ├── EstimateBuilder.tsx ⭐ the money component
│   ├── EnquiryForm.tsx     → WhatsApp (+ Meta opt-in checkbox)
│   └── PageHeader.tsx
└── lib/
    ├── site.ts             ⭐ SITE config — ALL client details live here
    └── catalogue.ts        ⭐ CATEGORIES + PRODUCTS (moves to D1 in Phase 2b)
```

## Two structural rules — don't undo these
1. **`<nav>` is a SIBLING of `<header>`, not a child.** `position:sticky` is confined to its
   parent's box, so a sticky nav inside the header scrolls away with it. Caught by driving it.
2. **The nav is a fixed `h-11` (44px) at every breakpoint**, and `EstimateBuilder`'s totals bar
   offsets against it with `top-[44px]`. A nav that changes height between breakpoints silently
   buries the totals bar — the most important number on the site. Change one, change both.

---

## ⬜ Phase 2b — not built yet
Needs client answers (`../WHAT-WE-NEED-FROM-CLIENT.md`) and a **re-quote**.

### Database — Cloudflare D1 + Drizzle
```bash
npx wrangler d1 create ssf-db
# add the binding to wrangler.jsonc, then:
npx wrangler d1 migrations apply ssf-db --local   # ⚠️ WITHOUT --local this hits PRODUCTION
```
```jsonc
// wrangler.jsonc
"d1_databases": [{ "binding": "DB", "database_name": "ssf-db", "database_id": "<uuid>" }]
```
```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
export const getDb = cache(() => drizzle(getCloudflareContext().env.DB, { schema }));
// per-request client — NOT a global singleton
```
Free tier: 5M rows read/day · 100K written/day · 5 GB · 500 MB per DB. Far more than needed.

### Schema sketch
```
categories   id, name, emoji, sort
products     id, category_id, name, content, list_price, is_green, active, sort
enquiries    id, name, phone, pincode, occasion, message, items_json, total, status, created_at
orders       id, enquiry_id, customer, phone, items_json, amount, advance_paid,
             status, transporter, lr_number, created_at, updated_at
order_events id, order_id, status, note, wa_sent_at, created_at
users        id, email, password_hash, role      ← Better Auth
settings     key, value                          ← discount %, min order, service states
```

### Auth — **Better Auth**
Native D1 support. ⚠️ **Lucia is dead** (deprecated Mar 2025) — do not use.

### Admin — `/admin`
products (add/edit/prices/stock/green flag) · enquiries inbox · orders + stage transitions ·
settings.

**Order stages** (confirm with client):
`Enquiry → Confirmed → Advance paid → Packed → Dispatched (LR) → Delivered`
Admin creates the order **after** a human confirms it by phone. **The site never sells** — that's
what keeps Phase 2 in the same legal box as Phase 1.

### WhatsApp automation
BSP (AiSensy/Interakt ₹1.5–2.5K/mo) + ~₹0.13/utility message. **Client pays.**
- Needs a dedicated number (or BSP "coexistence") + Meta business verification.
- Order-status = **UTILITY** template. ⚠️ Keep it strictly factual — since 2025-04-09 Meta
  auto-reclassifies templates containing promo language to **Marketing (6–7× the cost)**.
- The opt-in checkbox in `EnquiryForm.tsx` is **required by Meta policy**. Don't remove it.

### ⬜ Background music (client asked; agreed approach)
Toggle button in the nav, **off by default**, choice remembered. Browsers block autoplay-with-sound
anyway. Needs a **licensed** track from the client — don't ship a random mp3.

---

## 🚀 Deploy
```bash
npx wrangler login      # ⚠️ interactive/browser — Ganesh must run this: ! wrangler login
npm run deploy
```
CI/headless: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.
⚠️ The default "Edit Cloudflare Workers" token template **excludes D1**. A custom token needs
`D1:Edit`, `Workers Scripts:Edit`, `Account Settings:Read` (+ Zone `DNS:Edit` for the domain).

### Custom domain ⚠️ ask the client first
A Workers custom domain **requires the zone to be on Cloudflare** — there is no CNAME-only path.
Their domain is registered elsewhere → **nameservers must move to Cloudflare** (free, one-time).

🚨 **Check their MX records first.** If they have email on that domain and we move nameservers
without copying MX across, **their email stops working.** (The competitor has no MX — but that
proves nothing about our client.)

Also set `SITE.domain` in `src/lib/site.ts` — it drives `metadataBase` / OG tags.
