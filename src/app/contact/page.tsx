import type { Metadata } from "next";
import type { ComponentType } from "react";
import PageHeader from "@/components/PageHeader";
import EnquiryForm from "@/components/EnquiryForm";
import Fireworks from "@/components/Fireworks";
import {
	PhoneIcon,
	ChatIcon,
	MailIcon,
	PinIcon,
	ClockIcon,
	RupeeCardIcon,
	ShieldIcon,
	TruckIcon,
	SparkBurst,
	WhatsAppIcon,
} from "@/components/icons";
import { publicSite, telLinkTo, waLinkTo } from "@/lib/site";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = {
	title: "Contact Us — Order Sivakasi Crackers in Chennai",
	description:
		"Call or WhatsApp us for your Deepavali 2026 cracker order. Sivakasi crackers at wholesale rates, delivered across Chennai and South India. A real person answers.",
	keywords: ["contact Sivakasi crackers", "order crackers Chennai", "crackers WhatsApp Chennai"],
	alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

type Row = { Icon: ComponentType<{ className?: string }>; label: string; value: React.ReactNode };

export default async function ContactPage() {
	const site = publicSite(await getSettings());
	const rows: Row[] = [
		{
			Icon: PhoneIcon,
			label: "Phone",
			value: (
				<a href={telLinkTo(site.phone)} className="hover:text-brand">
					{site.phone}
				</a>
			),
		},
		{
			Icon: ChatIcon,
			label: "WhatsApp",
			value: (
				<a
					href={waLinkTo(site.whatsapp, `Hi ${site.name}, I'd like to enquire about your crackers.`)}
					target="_blank"
					rel="noopener"
					className="font-semibold text-[#128c4b] hover:underline"
				>
					Message us now →
				</a>
			),
		},
		{
			Icon: MailIcon,
			label: "Email",
			value: (
				<a href={`mailto:${site.email}`} className="hover:text-brand">
					{site.email}
				</a>
			),
		},
		{
			Icon: PinIcon,
			label: "Address",
			value: <>{site.addressLine}</>,
		},
		{ Icon: ClockIcon, label: "Hours", value: site.hours },
		...(site.gst ? [{ Icon: RupeeCardIcon, label: "GSTIN", value: site.gst }] : []),
		...(site.licence
			? [{ Icon: ShieldIcon, label: "Explosives licence", value: site.licence }]
			: []),
	];

	return (
		<>
			<PageHeader
				title="Contact Us"
				subtitle="WhatsApp is fastest, especially in season. Send your list or just ask — a real person answers."
			/>

			<section className="py-12">
				<div className="mx-auto grid max-w-292.5 gap-8 px-4 lg:grid-cols-2">
					{/* ---- details ---- */}
					<div className="space-y-6">
						<div className="border border-line bg-white p-6">
							<h2 className="mb-4 text-xl font-semibold text-ink">Reach us</h2>
							<dl>
								{rows.map((r) => (
									<div
										key={r.label}
										className="flex gap-3 border-b border-line py-3.5 last:border-b-0"
									>
										<r.Icon className="mt-0.5 h-5 w-5 flex-none text-brand" />
										<div>
											<dt className="text-[13px] font-semibold uppercase tracking-wider text-brand">
												{r.label}
											</dt>
											<dd className="text-[16px] leading-7 text-ink-soft">
												{r.value}
											</dd>
										</div>
									</div>
								))}
							</dl>
						</div>

						<div className="border border-line bg-white p-6">
							<h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ink">
								<TruckIcon className="h-5 w-5 text-brand" /> Where we deliver
							</h2>
							<p className="text-[16px] leading-7 text-ink-soft">
								Free delivery to your nearest <strong>transport office</strong> in:
							</p>
							<p className="mt-2 text-[16px] font-semibold leading-7 text-brand">
								{site.serviceStates.join(" · ")}
							</p>
							<p className="mt-3 text-[15px] leading-6 text-muted">
								Crackers cannot legally travel by courier or post — every order goes by
								goods transport and is collected from the depot. We do not deliver to
								Delhi-NCR or to states where sale is banned.
							</p>
						</div>

						{/* Quick-action card (replaces the old map). */}
						<div className="night-bg relative overflow-hidden rounded-lg border border-yellow/30 p-6 text-center text-white shadow-lg">
							<Fireworks embers={false} />
							<div className="relative z-10">
								<p className="flex items-center justify-center gap-2 text-[17px] font-bold text-yellow">
									<SparkBurst className="h-4 w-4" /> Fastest way to reach us
								</p>
								<p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-white/80">
									Call for a quick answer, or drop your cracker list on WhatsApp — a real
									person replies, even in the Deepavali rush.
								</p>
								<div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
									<a href={telLinkTo(site.phone)} className="btn-yellow shimmer">
										<PhoneIcon className="h-4 w-4" /> Call {site.phone}
									</a>
									<a
										href={waLinkTo(site.whatsapp, `Hi ${site.name}, I'd like to enquire about your crackers.`)}
										target="_blank"
										rel="noopener"
										className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] px-5 py-2.5 text-[15px] font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
									>
										<WhatsAppIcon className="h-4 w-4" /> WhatsApp us
									</a>
								</div>
							</div>
						</div>
					</div>

					{/* ---- form ---- */}
					<div className="space-y-4">
						<EnquiryForm whatsapp={site.whatsapp} phone={site.phone} brand={site.name} />
						<div className="rounded-lg border border-line bg-row p-4 text-[15.5px] leading-7 text-ink-soft">
							<strong className="mb-1 flex items-center gap-2 text-ink">
								<span className="h-3 w-3 flex-none rounded-xs bg-brand" aria-hidden />
								No online sale.
							</strong>{" "}
							This form sends a WhatsApp message — it does not place an order or take
							payment. We confirm stock and the final amount with you by phone, and
							payment is arranged offline, as required for firecracker sales in India.
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
