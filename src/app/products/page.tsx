import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import EstimateBuilder from "@/components/EstimateBuilder";
import { money } from "@/lib/site";
import { getCatalog, getSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Sivakasi Crackers Price List 2026 — Wholesale, Chennai",
	description:
		"Full Sivakasi crackers wholesale price list for Deepavali 2026 — sparklers, flower pots, ground chakkar, rockets, sky shots and gift boxes. Build your list and send it on WhatsApp for a same-day estimate in Chennai. Enquiry only — no online payment.",
	keywords: [
		"Sivakasi crackers price list",
		"crackers price list 2026",
		"crackers wholesale price Chennai",
		"Diwali crackers price list",
		"crackers gift box price",
	],
	alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
	const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);

	return (
		<>
			<PageHeader
				title="Price List"
				subtitle={`Set a quantity — your total updates live. Minimum order ${money(settings.minOrder)}.`}
			/>

			<section className="py-8">
				{/* Full-width table — expands to the viewport edges (minus padding). */}
				<div className="mx-auto w-full px-3 sm:px-5 lg:px-8">
					<EstimateBuilder
						categories={catalog.categories}
						products={catalog.products}
						settings={settings}
					/>

				</div>
			</section>
		</>
	);
}
