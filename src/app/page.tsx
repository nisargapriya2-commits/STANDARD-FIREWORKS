import Link from "next/link";
import Image from "next/image";
import { money, publicSite } from "@/lib/site";
import { getSettings, getLogoUrl, getCatalog, listSiteImages } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/catalogue";
import Fireworks from "@/components/Fireworks";
import FireworksCanvas from "@/components/FireworksCanvas";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import Countdown from "@/components/Countdown";
import Reveal from "@/components/Reveal";
import Zoomable from "@/components/Zoomable";
import {
	MedalIcon,
	LeafIcon,
	RupeeCardIcon,
	HangingLamp,
	LotusDivider,
} from "@/components/icons";
import type { ComponentType } from "react";

const FEATURES: { Icon: ComponentType<{ className?: string }>; title: string; body: string }[] = [
	{
		Icon: MedalIcon,
		title: "Quality Products",
		body: "12+ years buying in bulk at Sivakasi from established manufacturers, stored under a licensed magazine. The same boxes the big shops sell — at the rate we buy them for.",
	},
	{
		Icon: LeafIcon,
		title: "Eco Friendly",
		body: "We stock NEERI-certified green crackers. Certified boxes carry a QR code — scan it and verify the formulation yourself. We don't call anything green that isn't.",
	},
	{
		Icon: RupeeCardIcon,
		title: "Payment Options",
		body: "We call you once your estimate is placed, then share UPI or bank details on the call. No payment is taken on this website. Cash on delivery is not available.",
	},
];

export default async function Home() {
	const [settings, logoUrl, catalog, banners] = await Promise.all([
		getSettings(),
		getLogoUrl(),
		getCatalog(),
		listSiteImages("banner"),
	]);
	const site = publicSite(settings, logoUrl);
	// Featured strip: the real categories (so the owner's category photos show up),
	// falling back to the static showcase list if the database is unreachable.
	const featured = catalog.categories.filter((c) => c.line === "standard");
	const featuredItems = featured.length
		? featured.map((c) => ({ id: c.id, name: c.name, image: c.image }))
		: CATEGORIES.map((c) => ({ id: c.id, name: c.name, image: "" }));
	return (
		<>
			{/* ---------- TORAN / GARLAND ---------- */}
			<div className="toran" aria-hidden />

			{/* ---------- HERO ---------- */}
			<section className="night-bg relative overflow-hidden">
				{/*
				 * Hero backdrop, built from the client's supplied artwork with all of its
				 * baked-in text removed (see hero-sample/make-textfree.py). Two crops: the
				 * wide band, and a portrait recomposition for phones — cropping the wide one
				 * to a phone leaves almost no artwork visible.
				 * Painted before the canvas/sparkles below so they animate on top of it.
				 */}
				<picture>
					<source media="(max-width: 639px)" srcSet="/hero-bg-mobile.jpg" />
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/hero-bg.jpg"
						alt="Standard Fireworks Sivakasi festive celebration background"
						fetchPriority="high"
						decoding="async"
						className="absolute inset-0 h-full w-full object-cover object-bottom"
					/>
				</picture>
				{/* Darkens the headline side so the gold type keeps its contrast. */}
				<div
					aria-hidden
					className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,8,16,0.72)_0%,rgba(36,8,16,0.62)_60%,rgba(36,8,16,0.45)_100%)] sm:bg-[linear-gradient(90deg,rgba(36,8,16,0.80)_0%,rgba(36,8,16,0.45)_48%,rgba(36,8,16,0.12)_100%)]"
				/>
				<FireworksCanvas />
				<Fireworks />
				{/* hanging diyas — hand-drawn SVG lamps, not emoji */}
				<div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-around px-6 text-yellow">
					{Array.from({ length: 7 }).map((_, i) => (
						<span key={i} className="diya-glow" style={{ animationDelay: `${(i % 4) * 0.3}s` }}>
							<HangingLamp className="h-11 w-5" />
						</span>
					))}
				</div>

				<div className="relative z-10 mx-auto max-w-7xl px-4 py-12 lg:py-16 sm:px-6 lg:px-8">
					<div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
						{/* ---- LEFT: brand name + description ---- */}
						<Reveal className="text-center lg:text-left">
							<h1 className="leading-none">
								<span className="sr-only">
									Murugan Traders — Sivakasi crackers wholesale price list for Chennai, Deepavali 2026.{" "}
								</span>
								<span
									className="hero-brand-title block text-4xl sm:text-5xl lg:text-[3.85rem] font-black tracking-wider gold-text"
									aria-hidden
								>
									MURUGAN
								</span>
								<span
									className="hero-brand-title mt-1.5 sm:mt-2 block text-3xl sm:text-4xl lg:text-[3.15rem] font-extrabold tracking-[0.14em] gold-text"
									aria-hidden
								>
									TRADERS
								</span>
							</h1>
							<p className="mt-4 max-w-xl text-[15px] sm:text-[16px] text-white/80 leading-relaxed mx-auto lg:mx-0">
								Real Sivakasi crackers at wholesale rates, direct to Chennai &amp; South India —
								with extra savings the more you buy. Browse the full Deepavali 2026 price list.
							</p>
						</Reveal>

						{/* ---- RIGHT: Standard Fireworks logo + FLAT 50% discount ---- */}
						<Reveal delay={120} className="flex flex-col items-center justify-center text-center">
							{/* Standard Fireworks / Peacock logo */}
							<div className="mb-4 sm:mb-5 flex justify-center">
								<span className="logo-halo float inline-flex">
									{site.logo ? (
										// Owner-uploaded logo (admin → Photos); served from D1, so a plain <img>.
										// eslint-disable-next-line @next/next/no-img-element
										<img src={site.logo} alt={site.name} className="h-16 w-auto sm:h-20" />
									) : (
										<Image
											src="/brand-logo.png"
											alt="Standard Fireworks"
											width={411}
											height={108}
											priority
											className="h-16 w-auto sm:h-20"
										/>
									)}
								</span>
							</div>

							{/* FLAT 50% */}
							<div className="leading-none">
								<span className="gold-text block text-4xl sm:text-5xl lg:text-[3.75rem] font-black tracking-tight drop-shadow-md">
									FLAT {site.discountPct}%
								</span>
								<span className="mt-2 block text-2xl sm:text-3xl lg:text-[2.2rem] font-extrabold tracking-wide text-white drop-shadow-sm">
									OFF THE PRICE LIST
								</span>
							</div>

							{/* Festive Lotus divider */}
							<div className="mt-5 flex w-full max-w-[260px] sm:max-w-[280px] items-center justify-center gap-3 text-yellow/90">
								<span className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#ffd54a]/70 to-[#ffd54a]" />
								<LotusDivider className="h-5 w-5 flex-none text-yellow drop-shadow-[0_1px_4px_rgba(255,213,74,0.4)]" />
								<span className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#ffd54a]/70 to-[#ffd54a]" />
							</div>
						</Reveal>
					</div>
				</div>

				{/* live flip-clock countdown to the festival (Admin → Settings → Announcement banner) */}
				{site.festivalDate && (
					<div className="relative z-10 border-t border-yellow/15 bg-black/30 py-3 backdrop-blur-sm">
						<Countdown target={site.festivalDate} label={site.festivalName} />
					</div>
				)}

				{/* marquee-style announcement (editable in /admin → Settings) */}
				<div className="relative z-10 overflow-hidden bg-[#1c1c1c] py-2">
					<div className="marquee whitespace-nowrap text-[14px] font-semibold tracking-[0.2em] text-yellow">
						✦ {site.announcement} · MINIMUM ORDER {money(site.minOrder)} · ✦&nbsp;&nbsp;&nbsp;
						✦ {site.announcement} · MINIMUM ORDER {money(site.minOrder)} · ✦&nbsp;&nbsp;&nbsp;
					</div>
				</div>
			</section>

			{/* ---------- OWNER BANNERS (admin → Photos; the section hides itself when empty) ---------- */}
			{banners.length > 0 && (
				<section className="pt-10">
					<div className="mx-auto max-w-292.5 px-4">
						<div className={`grid gap-4 ${banners.length > 1 ? "sm:grid-cols-2" : ""}`}>
							{banners.map((b, i) => (
								<figure key={b.id} className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
									<Zoomable
										src={b.url}
										alt={b.caption || `${site.name} banner`}
										loading={i === 0 ? "eager" : "lazy"}
										className="h-full max-h-95 w-full object-cover"
									/>
									{b.caption && (
										<figcaption className="px-4 py-2.5 text-center text-[15px] font-medium text-ink-soft">
											{b.caption}
										</figcaption>
									)}
								</figure>
							))}
						</div>
					</div>
				</section>
			)}

			{/* ---------- FEATURED (auto-advancing carousel — one at a time) ---------- */}
			<section className="py-12">
				<div className="mx-auto max-w-250 px-4">
					<div className="mb-6 flex items-end justify-between gap-4">
						<div>
							<h2 className="text-2xl font-bold text-ink sm:text-3xl">Featured this season</h2>
							<p className="mt-1 text-[16px] text-muted">Our best-selling ranges — flip through or wait for the next.</p>
						</div>
						<Link href="/products" className="hidden text-[15px] font-semibold text-brand hover:underline sm:inline">
							See full price list →
						</Link>
					</div>

					<FeaturedCarousel
						items={featuredItems}
						discountPct={site.discountPct}
					/>
				</div>
			</section>

			{/* ---------- PROMO GRID ---------- */}
			<section className="pb-12">
				<div className="mx-auto grid max-w-[1600px] md:grid-cols-2">
					<div className="flex min-h-55 items-center justify-center bg-brand p-8 text-center text-white">
						<div>
							<p className="text-3xl font-bold sm:text-4xl">
								FLAT {site.discountPct}% OFF
							</p>
							<p className="mt-1 text-lg">for all crackers</p>
							<p className="mt-3 text-[16px] text-white/85">
								Let our crackers light up your night this season.
							</p>
							<Link href="/products" className="btn-yellow mt-5">
								ORDER NOW
							</Link>
						</div>
					</div>

					<div className="flex min-h-55 items-center justify-center bg-shell p-8 text-center">
						<div>
							<p className="text-2xl font-semibold text-brand sm:text-3xl">
								Minimum order {money(site.minOrder)}
							</p>
							<p className="mx-auto mt-3 max-w-sm text-[16px] leading-6 text-ink-soft">
								We care about our community. Our crackers are safe and secure for you
								and your environment. Orders begin at {money(site.minOrder)} — below
								that, transport costs more than the crackers do.
							</p>
						</div>
					</div>

					<div className="flex min-h-55 items-center justify-center bg-brand-dark p-8 text-center text-white md:col-span-2">
						<div>
							<p className="flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
								<MedalIcon className="h-7 w-7 text-yellow" /> Genuine Sivakasi Quality
							</p>
							<p className="mx-auto mt-3 max-w-md text-[16px] leading-6 text-white/85">
								Serving families across Chennai for over a decade. Bought in bulk,
								stored under a licensed magazine, and sold direct — so you get the real
								boxes at the real wholesale rate.
							</p>
							<Link href="/about" className="btn-yellow mt-5">
								ABOUT US
							</Link>
						</div>
					</div>
				</div>

				<div className="mt-8 text-center">
					<Link href="/products" className="btn-yellow">
						ORDER NOW
					</Link>
				</div>
			</section>

			{/* ---------- FEATURES ---------- */}
			{/* Inline icon-left rows in an asymmetric 2-col band — not the
			    icon-over-heading card grid. First row spans wide as a lead. */}
			<section className="bg-brand py-14 text-white">
				<div className="mx-auto max-w-292.5 px-4">
					<h2 className="max-w-xl text-2xl font-bold sm:text-3xl">
						Why families across South India buy from us
					</h2>
					<div className="mt-9 grid gap-x-12 gap-y-9 sm:grid-cols-2">
						{FEATURES.map((f, i) => (
							<div
								key={f.title}
								className={`flex gap-4 ${i === 0 ? "sm:col-span-2 sm:max-w-3xl" : ""}`}
							>
								<f.Icon className="mt-0.5 h-9 w-9 flex-none text-yellow" />
								<div>
									<h3 className="text-lg font-semibold">{f.title}</h3>
									<p className="mt-1 text-[15.5px] leading-7 text-white/85">{f.body}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ---------- DISCOUNT BAND ---------- */}
			<section className="night-bg relative overflow-hidden py-14 text-center text-white">
				<Fireworks />
				<div className="relative z-10 mx-auto max-w-292.5 px-4">
					<h2 className="gold-ink text-2xl font-extrabold sm:text-4xl">
						{site.discountPct}% DISCOUNT ON ALL PRODUCTS
					</h2>
					<div className="gold-rule" />
					<p className="mx-auto mt-3 max-w-2xl text-[16px] text-white/75">
						We sell quality Sivakasi crackers to our customers at honest, reasonable
						rates — all through the season.
					</p>
					<ul className="mx-auto mt-5 space-y-1 text-[16px] text-white/85">
						<li>Boxes bought direct from Sivakasi manufacturers</li>
						<li>Stored under a licensed magazine</li>
						<li>The printed list price — no invented discounts</li>
						<li>A real person on the phone, not a call centre</li>
					</ul>
					<Link href="/about" className="btn-yellow mt-7">
						READ MORE
					</Link>
				</div>
			</section>

			{/* ---------- OCCASIONS ---------- */}
			<section className="bg-shell py-12">
				<div className="mx-auto max-w-292.5 px-4 text-center">
					<h2 className="section-title">Every Celebration, Covered</h2>
					<div className="gold-rule" />
					<p className="mx-auto mt-3 max-w-3xl text-[16px] leading-6 text-ink-soft">
						We also supply crackers for Christmas, New Year, Pongal, weddings and temple
						functions. We are available to take orders round the year.
					</p>
					<div className="mt-6 flex flex-wrap justify-center gap-2 text-[15px]">
						{[
							"Deepavali",
							"Christmas & New Year",
							"Pongal",
							"Weddings & Temple Functions",
						].map((t) => (
							<span
								key={t}
								className="inline-flex items-center gap-2 border border-line bg-white px-3.5 py-1.5"
							>
								<span className="h-1.5 w-1.5 rounded-full bg-yellow" aria-hidden />
								{t}
							</span>
						))}
					</div>
				</div>
			</section>

			{/* ---------- LEGAL ---------- */}
			<section className="py-10">
				<div className="mx-auto max-w-292.5 px-4">
					<div className="rounded-lg border border-line bg-row p-5 text-[15.5px] leading-6 text-ink-soft">
						<p className="mb-1 flex items-center gap-2 font-semibold text-ink">
							<span className="h-3 w-3 flex-none rounded-xs bg-brand" aria-hidden />
							How ordering works — please read.
						</p>
						Sale and use of firecrackers in India is regulated by orders of the
						Hon&apos;ble Supreme Court and by the Explosives Act, 1884 / Explosives
						Rules, 2008.{" "}
						<strong>
							This website does not sell crackers online and does not accept online
							payment.
						</strong>{" "}
						The price list here is for enquiry only — you send us your list, we confirm
						availability and the final estimate by phone, and payment is completed
						offline. Delivery is by goods transport to your nearest transport office;
						crackers cannot legally be sent by courier or post. We do not deliver to
						Delhi-NCR or to any state where sale is banned.
					</div>
				</div>
			</section>
		</>
	);
}
