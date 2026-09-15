import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { publicSite } from "@/lib/site";
import { getSettings, listSiteImages } from "@/lib/catalog";
import {
	ShieldIcon,
	LeafIcon,
	TagIcon,
	BoxIcon,
	EyeIcon,
	BucketIcon,
	NoIcon,
	ShirtIcon,
	ExpandIcon,
	ClockIcon,
} from "@/components/icons";
import Zoomable from "@/components/Zoomable";

type Item = { Icon: ComponentType<{ className?: string }>; title: string; body: string };

export const metadata: Metadata = {
	title: "About Us — Sivakasi Crackers Dealer for Chennai",
	description:
		"A Sivakasi family in the fireworks trade for over 12 years. We buy wholesale in Sivakasi, store under a licensed magazine, and sell crackers direct to families across Chennai and South India — no middlemen, one honest price.",
	keywords: ["Sivakasi crackers dealer", "crackers wholesale Chennai", "Standard Fireworks Sivakasi"],
	alternates: { canonical: "/about" },
};

export const dynamic = "force-dynamic";

const VALUES: Item[] = [
	{
		Icon: ShieldIcon,
		title: "Licensed & legal",
		body: "We hold the explosives licence required to store and sell fireworks, and we operate within the Explosives Rules, 2008 and the Supreme Court's orders on firecracker sale.",
	},
	{
		Icon: LeafIcon,
		title: "Genuinely green",
		body: "We stock NEERI-certified green crackers. Certified boxes carry a QR code — scan it with the CSIR-NEERI app and verify the formulation yourself. We don't label anything green that isn't.",
	},
	{
		Icon: TagIcon,
		title: "One honest price",
		body: "The price list is the price. We don't quote one rate on WhatsApp and another on the phone, and we don't invent a fake discount off a fake list price.",
	},
	{
		Icon: BoxIcon,
		title: "Packed for the road",
		body: "Every order is packed for lorry transport and checked before it leaves. If something arrives damaged, call us — we'll make it right.",
	},
];

const SAFETY: Item[] = [
	{ Icon: EyeIcon, title: "Adults, always", body: "Children should never light crackers without an adult standing with them. Not nearby — with them." },
	{ Icon: BucketIcon, title: "Water ready", body: "Keep a bucket of water and sand within reach before you light the first one, not after." },
	{ Icon: NoIcon, title: "Never relight a dud", body: "If it doesn't go off, leave it. Soak it in water after a few minutes. Never lean over it." },
	{ Icon: ShirtIcon, title: "Cotton, not synthetics", body: "Loose synthetic clothing catches and melts. Cotton is safer. Tie long hair back." },
	{ Icon: ExpandIcon, title: "Open space only", body: "Light in the open, away from vehicles, thatch, dry leaves and gas cylinders. Never indoors or on a balcony." },
	{ Icon: ClockIcon, title: "Respect the timing", body: "Courts set the bursting window each year — usually two short slots. Respect it, and keep clear of silence zones near hospitals." },
];

export default async function AboutPage() {
	const [settings, photos] = await Promise.all([getSettings(), listSiteImages("about")]);
	const site = publicSite(settings);
	const storyParas = site.aboutStory.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
	// First uploaded picture sits beside the story; the rest become a strip below it.
	const [lead, ...rest] = photos;
	return (
		<>
			<PageHeader
				title="About Us"
				subtitle="Sivakasi makes the overwhelming majority of India's fireworks. We're a family business from here, and we cut out every step between the factory and your front door."
			/>

			<section className="py-12">
				<div className="mx-auto grid max-w-292.5 items-center gap-10 px-4 md:grid-cols-2">
					{lead ? (
						<figure>
							<Zoomable
								src={lead.url}
								alt={lead.caption || `${site.name} shop`}
								className="aspect-4/3 w-full rounded-xl border border-line object-cover shadow-sm"
							/>
							{lead.caption && (
								<figcaption className="mt-2 text-center text-[15px] text-muted">{lead.caption}</figcaption>
							)}
						</figure>
					) : (
						// No photo uploaded yet (admin → Photos) — a plain brand panel, never an
						// empty "[ photo here ]" box on a live customer-facing page.
						<div className="night-bg grid aspect-4/3 place-items-center rounded-xl px-6 text-center text-white shadow-sm">
							<div>
								<p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-yellow">
									Since 2014
								</p>
								<p className="mt-2 text-2xl font-bold">{site.name}</p>
								<p className="mt-1 text-[15px] text-white/80">{site.addressLine}</p>
							</div>
						</div>
					)}
					<div>
						<h2 className="mb-4 text-2xl font-semibold text-ink">Our story</h2>
						{storyParas.map((para, i) => (
							<p
								key={i}
								className={`text-[16px] leading-7 text-ink-soft ${i < storyParas.length - 1 ? "mb-4" : ""}`}
							>
								{para}
							</p>
						))}
						{site.stockistOf && (
							<p className="mt-4 text-[16px] leading-7 text-ink-soft">
								We stock products from <strong>{site.stockistOf}</strong>.
							</p>
						)}
					</div>
				</div>
			</section>

			{/* Owner's other shop photos (admin → Photos). Hidden until there are some. */}
			{rest.length > 0 && (
				<section className="pb-12">
					<div className="mx-auto max-w-292.5 px-4">
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{rest.map((ph) => (
								<figure key={ph.id}>
									<Zoomable
										src={ph.url}
										alt={ph.caption || `${site.name} photo`}
										loading="lazy"
										className="aspect-4/3 w-full rounded-xl border border-line object-cover shadow-sm"
									/>
									{ph.caption && (
										<figcaption className="mt-1.5 text-center text-[14.5px] text-muted">
											{ph.caption}
										</figcaption>
									)}
								</figure>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Inline icon-left rows, left-aligned heading — not the icon-over-heading card grid. */}
			<section className="bg-shell py-14">
				<div className="mx-auto max-w-292.5 px-4">
					<h2 className="text-2xl font-bold text-ink sm:text-3xl">What we stand on</h2>
					<p className="mt-1 text-[16px] text-muted">Four things we don&apos;t compromise.</p>
					<div className="mt-9 grid gap-x-12 gap-y-8 sm:grid-cols-2">
						{VALUES.map((v) => (
							<div key={v.title} className="flex gap-4">
								<v.Icon className="mt-0.5 h-9 w-9 flex-none text-brand" />
								<div>
									<h3 className="text-lg font-semibold text-ink">{v.title}</h3>
									<p className="mt-1 text-[15.5px] leading-7 text-muted">{v.body}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="py-14">
				<div className="mx-auto max-w-292.5 px-4">
					<h2 className="text-2xl font-bold text-ink sm:text-3xl">Please burst responsibly</h2>
					<p className="mt-1 max-w-2xl text-[16px] text-muted">
						Crackers are explosives. Every year people are hurt by things that were
						entirely avoidable.
					</p>
					<div className="mt-9 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
						{SAFETY.map((s) => (
							<div key={s.title} className="flex gap-3.5">
								<s.Icon className="mt-0.5 h-8 w-8 flex-none text-brand" />
								<div>
									<h3 className="text-[16px] font-semibold text-ink">{s.title}</h3>
									<p className="mt-1 text-[15.5px] leading-7 text-muted">{s.body}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section className="bg-brand py-12 text-center text-white">
				<div className="mx-auto max-w-292.5 px-4">
					<h2 className="text-2xl font-bold sm:text-3xl">Ready to book?</h2>
					<p className="mx-auto mt-3 max-w-xl text-[16px] text-white/85">
						Build your list from our price list and send it over. We&apos;ll call you
						back the same day with the final estimate.
					</p>
					<Link href="/products" className="btn-yellow mt-6">
						VIEW THE PRICE LIST
					</Link>
				</div>
			</section>
		</>
	);
}
