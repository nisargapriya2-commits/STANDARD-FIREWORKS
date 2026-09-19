import type { Metadata } from "next";
import Script from "next/script";
import { Rubik } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PublicOnly from "@/components/PublicOnly";
import WelcomePopup from "@/components/WelcomePopup";
import MetaPixel from "@/components/MetaPixel";
import { CartProvider } from "@/lib/cart";
import { SITE, publicSite } from "@/lib/site";
import { getSettings, getLogoUrl, getPriceListPdfMeta } from "@/lib/catalog";
import JsonLd from "@/components/JsonLd";
import { SEO_KEYWORDS, localBusinessJsonLd, websiteJsonLd } from "@/lib/seo";

const rubik = Rubik({
	variable: "--font-rubik",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
	const s = await getSettings();
	const title = s.metaTitle || `${SITE.name} — Sivakasi Wholesale Crackers Price List`;
	return {
		metadataBase: new URL(SITE.domain),
		title: {
			default: title,
			template: `%s — ${SITE.name}`,
		},
		description: s.metaDescription,
		keywords: SEO_KEYWORDS,
		applicationName: SITE.name,
		alternates: { canonical: "/" },
		openGraph: {
			type: "website",
			locale: "en_IN",
			siteName: SITE.name,
			url: SITE.domain,
			title,
			description: s.metaDescription,
			images: [{ url: "/brand-logo.png", width: 411, height: 108, alt: SITE.name }],
		},
		twitter: {
			card: "summary",
			title,
			description: s.metaDescription,
			images: ["/brand-logo.png"],
		},
		// Belt-and-braces with robots.txt: while prices are placeholders the site
		// stays out of the index at the page level too. robots.txt stops crawling;
		// this stops indexing of anything already discovered via an inbound link.
		robots: SITE.pricesAreProvisional
			? { index: false, follow: false, googleBot: { index: false, follow: false } }
			: {
					index: true,
					follow: true,
					googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
				},
		verification: {
			google: SITE.googleVerification || undefined,
			other: SITE.bingVerification ? { "msvalidate.01": SITE.bingVerification } : {},
		},
		icons: {
			icon: [
				{ url: "/favicon.ico" },
				{ url: "/favicon.jpg", type: "image/jpeg" },
			],
			shortcut: "/favicon.ico",
			apple: [
				{ url: "/favicon.jpg", type: "image/jpeg" },
			],
		},
		category: "shopping",
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [settings, logoUrl, priceListPdf] = await Promise.all([
		getSettings(),
		getLogoUrl(),
		getPriceListPdfMeta(),
	]);
	const site = publicSite(settings, logoUrl, priceListPdf?.url ?? "");
	const gaId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || settings.gaId || SITE.gaMeasurementId || "").trim();
	const isGaIdValid = /^G-[A-Z0-9]+$/i.test(gaId);

	return (
		<html lang="en" className={rubik.variable}>
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&display=swap"
					rel="stylesheet"
				/>
				{isGaIdValid && (
					<>
						<Script
							src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
							strategy="afterInteractive"
						/>
						<Script id="google-analytics" strategy="afterInteractive">
							{`
								window.dataLayer = window.dataLayer || [];
								function gtag(){dataLayer.push(arguments);}
								gtag('js', new Date());
								gtag('config', '${gaId}', {
									page_path: window.location.pathname,
								});
							`}
						</Script>
					</>
				)}
			</head>
			<body className="flex min-h-screen flex-col antialiased">
				<MetaPixel />
				<JsonLd data={localBusinessJsonLd(site)} />
				<JsonLd data={websiteJsonLd()} />
				<CartProvider>
					<PublicOnly>
						<Header site={site} />
					</PublicOnly>
					<main className="flex-1">{children}</main>
					<PublicOnly>
						<Footer site={site} />
						<WelcomePopup site={site} />
					</PublicOnly>
				</CartProvider>
			</body>
		</html>
	);
}
