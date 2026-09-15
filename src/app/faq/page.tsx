import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { money, publicSite, type PublicSite } from "@/lib/site";
import { getSettings } from "@/lib/catalog";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
	title: "FAQ — Ordering Sivakasi Crackers in Chennai",
	description:
		"How ordering, delivery and payment work for Sivakasi crackers in Chennai. Answers on green crackers, transport, minimum order, bulk & temple orders, and the legal rules on firecracker sale in India.",
	keywords: ["Sivakasi crackers delivery Chennai", "green crackers", "crackers bulk order Chennai"],
	alternates: { canonical: "/faq" },
};

/** Plain-text FAQs for FAQPage structured data (rich result on Google/Bing). */
const FAQ_LD: { q: string; a: string }[] = [
	{
		q: "How do I order Sivakasi crackers from Chennai?",
		a: "Open the price list, set the quantity for what you want, and send your list on WhatsApp. We check stock, add transport, and call you back the same day with the final estimate. Nothing is confirmed until you agree on that call.",
	},
	{
		q: "Can I buy crackers online directly on the website?",
		a: "No. The Supreme Court's orders prohibit the online sale of firecrackers in India, so this site is a price-list and enquiry tool only. Your order is confirmed by phone and paid for offline by UPI or bank transfer.",
	},
	{
		q: "Is there a minimum order?",
		a: "Yes. Below the minimum, transport costs more than the crackers, so it isn't worth it for either side. The current minimum is shown on the price list and checkout.",
	},
	{
		q: "Where do you deliver Sivakasi crackers?",
		a: "To your nearest transport office across Tamil Nadu, Puducherry, Kerala, Karnataka, Andhra Pradesh and Telangana. You collect your parcel from the depot with your ID and the LR number we send you. We do not deliver to Delhi-NCR or any state where sale is banned.",
	},
	{
		q: "Why can't crackers be couriered to my house?",
		a: "Because fireworks are explosives and are prohibited in the post — DHL, FedEx and courier companies all refuse them. Every genuine Sivakasi seller ships by goods transport to a depot for collection.",
	},
	{
		q: "How do I pay?",
		a: "After we confirm your order on the phone, we share our UPI ID or bank details. You transfer and send the screenshot. There is no payment gateway on this website, by design. Cash on delivery is not available.",
	},
	{
		q: "Are your crackers green crackers?",
		a: "The certified ones are labelled and carry a QR code you can scan with the CSIR-NEERI app to verify the formulation. We only call an item green when it is genuinely certified.",
	},
	{
		q: "Do you handle bulk, temple or corporate orders?",
		a: "Yes. Send your list or budget on WhatsApp and we'll build a package and a sharper rate for the volume. We can raise a GST invoice for company orders.",
	},
];

export const dynamic = "force-dynamic";

type QA = { q: string; a: React.ReactNode };

function buildGroups(site: PublicSite): { heading: string; items: QA[] }[] {
	return [
	{
		heading: "Ordering",
		items: [
			{
				q: "How do I place an order?",
				a: (
					<>
						Open the{" "}
						<Link href="/products" className="text-brand underline">
							price list
						</Link>
						, set the quantity against whatever you want, and tap{" "}
						<strong>Send list on WhatsApp</strong>. Your list arrives with us as a
						message. We check stock, add transport, and call you back the same day with
						the final estimate. Nothing is confirmed until you say yes on that call.
					</>
				),
			},
			{
				q: "Can I just buy directly on the website?",
				a: (
					<>
						No — and no legitimate firecracker seller in India can offer that. The
						Supreme Court&apos;s orders prohibit the online sale of firecrackers, so this
						site is an enquiry and price-list tool only. Your order is confirmed by phone
						and paid for offline. Anyone offering you a &ldquo;Buy Now&rdquo; button for
						crackers is not operating within the rules.
					</>
				),
			},
			{
				q: "Is there a minimum order?",
				a: (
					<>
						Yes — <strong>{money(site.minOrder)}</strong>. Below that, transport costs
						more than the crackers do, so it isn&apos;t worth it for either of us.
					</>
				),
			},
			{
				q: "When should I book?",
				a: "As early as you can. Orders are packed in the order they're confirmed, and in the last two weeks before Deepavali both stock and lorry space get tight. Booking early gets you a better selection and a better transport slot — not a better price, we don't play that game.",
			},
			{
				q: "Can I change my list after sending it?",
				a: "Of course — until you've confirmed on the call and paid the advance, nothing is locked. Just message us the change.",
			},
			{
				q: "Do you have a physical shop I can visit?",
				a: "We work direct from our stock point, not a retail showroom — that's exactly why our rate is what it is. If you'd like to see popular items before deciding, ask on WhatsApp and we'll share photos and a short video of what's in stock.",
			},
			{
				q: "How do I know my WhatsApp list actually reached you?",
				a: "You'll see it delivered in your own WhatsApp, and we reply to confirm we've received it — usually within a couple of hours in season. If you haven't heard back by the next morning, message again or call; sometimes the rush is real.",
			},
			{
				q: "Can I order for someone else / send it to a different address?",
				a: "Yes. Tell us on the call whose name the transport receipt (LR) should be in and which transport office is nearest to the person collecting it. Whoever collects needs their ID and the LR number.",
			},
		],
	},
	{
		heading: "Payment",
		items: [
			{
				q: "How do I pay?",
				a: (
					<>
						After we confirm your order on the phone, we share our UPI ID or bank details
						with you directly. You transfer and send us the screenshot.{" "}
						<strong>We never collect payment through this website</strong> — there is no
						payment gateway here, by design.
					</>
				),
			},
			{
				q: "Is cash on delivery available?",
				a: "No. Goods transport operators don't collect payment on our behalf, so orders are settled before dispatch.",
			},
			{
				q: "Do I have to pay the full amount up front?",
				a: "We take a part-advance to confirm and pack your order, and the balance before dispatch — the exact split we'll agree with you on the call. We don't dispatch anything that isn't fully settled, so there's no surprise at the depot.",
			},
			{ q: "Will I get a bill?", a: "Yes — a proper GST invoice with every order." },
			{
				q: "What if I need to cancel after paying the advance?",
				a: "Talk to us as early as you can. If we haven't packed and booked your parcel yet, we'll sort out a fair adjustment. Once it's packed and handed to transport, it can't be pulled back — crackers can't simply be restocked and re-sold freely.",
			},
			{
				q: "Are UPI and bank transfer the only options?",
				a: "For now, yes — UPI (Google Pay / PhonePe / Paytm) or a direct bank transfer. Both give you an instant record of payment, which protects you as much as us.",
			},
		],
	},
	{
		heading: "Delivery & transport",
		items: [
			{
				q: "Where do you deliver?",
				a: (
					<>
						To your nearest <strong>transport office</strong> across{" "}
						{site.serviceStates.join(", ")}. You collect your parcel from the depot with
						your ID and the LR number we send you. We&apos;ll tell you the exact office
						when we call.
					</>
				),
			},
			{
				q: "Why can't you courier it to my house?",
				a: "Because it's illegal, not because we don't want to. Fireworks are explosives — they're a prohibited item in the post, and DHL, FedEx, Professional Courier and the rest all refuse flammable goods. Every genuine Sivakasi seller ships by goods transport to a depot. Anyone promising doorstep courier delivery of crackers is either lying or breaking the law.",
			},
			{
				q: "How much is transport?",
				a: "It depends on the destination and the size of the parcel, and it's added to your estimate before you confirm — never a hidden extra sprung on you at the depot. For nearby Tamil Nadu it's modest; the further out, the more the lorry charges.",
			},
			{
				q: "Do you deliver to Delhi / NCR?",
				a: "No. Firecracker sale in Delhi-NCR is restricted by ongoing Supreme Court orders that change from year to year, and crackers may not be brought into the region from outside. We also don't send to any other state where sale is banned at the time of your order.",
			},
			{
				q: "How long does it take?",
				a: "Within Tamil Nadu, typically 2–3 days after dispatch. Elsewhere in South India, 3–6 days. During the Deepavali rush, add a few days — the lorries are as busy as we are.",
			},
			{
				q: "What if my parcel arrives damaged?",
				a: "Check it at the depot before you leave, if you can. If something's crushed or missing, call us the same day with a photo and we'll make it right. We pack for the road precisely so this rarely happens.",
			},
			{
				q: "How will I know when it has reached the transport office?",
				a: "We send you the LR (lorry receipt) number when we dispatch, and we message you when the office confirms arrival. Carry your ID and that number to collect.",
			},
		],
	},
	{
		heading: "Green crackers & safety",
		items: [
			{
				q: "Are your crackers green crackers?",
				a: "The ones that are certified are labelled as such — and they carry a QR code you can scan with the CSIR-NEERI app to verify the formulation for yourself. We won't put '100% green' across our whole catalogue the way some sites do; that claim only means something when it's certified, and we'd rather you could check.",
			},
			{
				q: "What are green crackers, exactly?",
				a: "They're formulations developed by CSIR-NEERI with PESO that drop barium salts and cut particulate emissions by roughly 30–40% compared with conventional crackers. Barium-based crackers are banned nationwide by the Supreme Court.",
			},
			{
				q: "What's the timing rule for bursting?",
				a: "Courts set a bursting window each year — in Tamil Nadu it has recently been two one-hour slots, typically early morning and evening. It changes year to year, so check the current year's notification before Deepavali, and keep clear of silence zones near hospitals.",
			},
			{
				q: "How should I store crackers safely at home?",
				a: "Keep them in a cool, dry place away from any flame, cooking area, or electrical point — a closed box, not loose. Don't stockpile more than you'll use, and keep them well out of children's reach.",
			},
			{
				q: "What safety basics should I follow while bursting?",
				a: "Light in the open, away from vehicles, dry leaves and gas cylinders — never indoors or on a balcony. Keep a bucket of water and sand within reach, an adult with every child, and never lean over a cracker to relight a dud — soak it instead. Cotton clothing, not synthetics.",
			},
			{
				q: "Are crackers safe for young children to light?",
				a: "Sparklers and ground items only, and only with an adult standing with them — not merely nearby. Aerial and high-decibel items are for adults. Ear protection is worth it for little ones who are watching.",
			},
		],
	},
	{
		heading: "Bulk, temple & corporate orders",
		items: [
			{
				q: "Do you handle large orders for temples, weddings or societies?",
				a: (
					<>
						Yes — that&apos;s a big part of what we do. Send us your list or your budget on{" "}
						<Link href="/contact" className="text-brand underline">
							WhatsApp
						</Link>{" "}
						and we&apos;ll put together a package and a sharper rate for the volume. Book
						early for large functions; these get tight first.
					</>
				),
			},
			{
				q: "Can you help me build a package to a fixed budget?",
				a: "Absolutely. Tell us the amount and the occasion — a family Deepavali, a wedding, a temple function — and we'll suggest a balanced mix of sound, aerial, ground and kids' items so nothing's wasted.",
			},
			{
				q: "Do you supply for Christmas, New Year and Pongal too?",
				a: "Yes. We take orders round the year for Christmas, New Year, Pongal, weddings and temple functions — not only Deepavali.",
			},
			{
				q: "Can you give a GST invoice for a company / institutional order?",
				a: "Yes — give us your GST number and billing name when you confirm, and we'll raise a proper GST invoice in that name.",
			},
		],
	},
	{
		heading: "About us & trust",
		items: [
			{
				q: "Who are you, exactly?",
				a: (
					<>
						A Sivakasi family in the cracker trade for over 12 years. We buy wholesale
						here and sell direct — no showroom, no middlemen, no commission. More on the{" "}
						<Link href="/about" className="text-brand underline">
							About Us
						</Link>{" "}
						page.
					</>
				),
			},
			{
				q: "Why are you cheaper than the shops?",
				a: "Because we cut out the steps between the factory and you — no showroom rent, no salesmen, no commission agents. Same boxes the big shops sell, at close to the rate we buy them for. That's the whole model.",
			},
			{
				q: `Is the ${site.discountPct}% discount genuine?`,
				a: "Our discount is off the printed manufacturer list price, which is how the whole Sivakasi trade quotes. What matters is the number in the 'Your price' column — that's what you actually pay, and it's the same number we'll say on the phone. No invented 'was' price.",
			},
			{
				q: "What if my question isn't answered here?",
				a: (
					<>
						Just{" "}
						<Link href="/contact" className="text-brand underline">
							WhatsApp or call us
						</Link>
						. A real person answers — no bots, no call centre.
					</>
				),
			},
		],
	},
	];
}

export default async function FaqPage() {
	const site = publicSite(await getSettings());
	const GROUPS = buildGroups(site);
	return (
		<>
			<JsonLd data={faqJsonLd(FAQ_LD)} />
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: "FAQ", path: "/faq" },
				])}
			/>
			<PageHeader
				title="Frequently Asked Questions"
				subtitle="Everything about ordering, payment, delivery, green crackers, safety and bulk orders. If your question isn't here, just WhatsApp us — a real person answers."
			/>

			<section className="py-14">
				{/* Full-width — the six groups flow across two columns (masonry) so
				    the page width is used, while each answer stays a readable width. */}
				<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="lg:columns-2 lg:gap-8">
						{GROUPS.map((g) => (
							<div key={g.heading} className="mb-8 break-inside-avoid lg:inline-block lg:w-full">
								<h2 className="mb-5 border-b-2 border-brand pb-2 text-2xl font-bold text-brand">
									{g.heading}
								</h2>
								<div className="overflow-hidden rounded-lg border border-line shadow-sm">
									{g.items.map((item, i) => (
										<details
											key={item.q}
											className="group border-b border-line last:border-b-0"
											open={i === 0 && g.heading === "Ordering"}
										>
											<summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-white px-5 py-4 text-[17px] font-semibold text-ink transition-colors hover:bg-row group-open:bg-row">
												{item.q}
												<span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand/10 text-xl font-bold text-brand transition-transform group-open:rotate-45">
													+
												</span>
											</summary>
											<div className="bg-white px-5 pb-5 text-[16px] leading-8 text-ink-soft">
												{item.a}
											</div>
										</details>
									))}
								</div>
							</div>
						))}
					</div>

					<div className="mt-4 rounded-lg border border-line bg-row p-5 text-[15.5px] leading-7 text-ink-soft">
						<strong className="mb-1 flex items-center gap-2 text-ink">
							<span className="h-3 w-3 flex-none rounded-xs bg-brand" aria-hidden />
							The legal bit.
						</strong>{" "}
						Sale and use of
						firecrackers in India is governed by orders of the Hon&apos;ble Supreme Court
						and by the Explosives Act, 1884 and Explosives Rules, 2008. This website does
						not sell crackers online and does not accept online payment; it is a price
						list and enquiry tool only. Rules on permitted crackers, bursting windows and
						regional bans change from year to year — please check the current position for
						your state before ordering.
					</div>
				</div>
			</section>
		</>
	);
}
