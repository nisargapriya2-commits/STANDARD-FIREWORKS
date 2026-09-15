import type { Metadata } from "next";
import CheckoutFlow from "@/components/CheckoutFlow";
import ProvisionalPriceNotice from "@/components/ProvisionalPriceNotice";
import { getCatalog, getSettings } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Checkout",
	robots: { index: false, follow: true },
	alternates: { canonical: "/checkout" },
	description:
		"Confirm your details and complete payment for your cracker order. Payment is manual (UPI / bank) — upload the receipt and we verify it before dispatch.",
};

export default async function CheckoutPage() {
	const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
	return (
		<>
			<ProvisionalPriceNotice />
			<section className="border-b border-line bg-shell py-8">
				<div className="mx-auto max-w-[860px] px-4">
					<h1 className="text-2xl font-bold text-ink sm:text-3xl">Checkout</h1>
					<p className="mt-2 text-[16px] leading-6 text-ink-soft">
						Three quick steps — your details, payment, then upload the receipt so we
						can verify it. No payment is processed on this website.
					</p>
				</div>
			</section>

			<section className="py-8">
				<div className="mx-auto max-w-[860px] px-4">
					<CheckoutFlow products={catalog.products} settings={settings} />
				</div>
			</section>
		</>
	);
}
