import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { money, publicSite } from "@/lib/site";
import { getCatalog, getSettings } from "@/lib/catalog";
import { discountPctOf, inStock } from "@/lib/catalog-types";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Zoomable from "@/components/Zoomable";
import ProductOrderBox from "@/components/ProductOrderBox";
import { CategoryIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

async function findProduct(id: string) {
	const catalog = await getCatalog();
	const product = catalog.products.find((p) => p.id === id);
	if (!product) return null;
	const category = catalog.categories.find((c) => c.id === product.categoryId) ?? null;
	return { product, category, catalog };
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const found = await findProduct(id);
	if (!found) return { title: "Product not found" };
	const { product, category } = found;
	const priceStr = product.price ? `₹${product.price.toLocaleString("en-IN")}` : "price on enquiry";
	const title = `${product.name}${product.content ? ` (${product.content})` : ""} — ${priceStr} | Sivakasi Crackers, Chennai`;
	const description = `${product.name}${product.content ? `, ${product.content}` : ""} from our ${category?.name ?? "Sivakasi crackers"} range. Wholesale Sivakasi crackers delivered direct to Chennai & South India. Enquiry only — no online payment.`;
	return {
		title,
		description,
		alternates: { canonical: `/products/${product.id}` },
	};
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const found = await findProduct(id);
	if (!found || !found.product.active) notFound();
	const { product, category, catalog } = found;

	const settings = await getSettings();
	const site = publicSite(settings);
	const discountPct = discountPctOf(product);
	const soldOut = product.stock === 0;
	const related = catalog.products
		.filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.active)
		.slice(0, 6);

	return (
		<>
			<JsonLd
				data={productJsonLd({
					id: product.id,
					name: product.name,
					content: product.content,
					price: product.price,
					mrp: product.mrp,
					image: product.image,
					categoryName: category?.name ?? "Sivakasi crackers",
					inStock: inStock(product),
				})}
			/>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", path: "/" },
					{ name: "Price List", path: "/products" },
					...(category ? [{ name: category.name, path: `/products#${category.id}` }] : []),
					{ name: product.name, path: `/products/${product.id}` },
				])}
			/>

			<section className="py-8">
				<div className="mx-auto max-w-292.5 px-4">
					{/* ---- breadcrumb ---- */}
					<nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-[14px] text-muted">
						<Link href="/" className="hover:text-brand hover:underline">
							Home
						</Link>
						<span aria-hidden>/</span>
						<Link href="/products" className="hover:text-brand hover:underline">
							Price List
						</Link>
						{category && (
							<>
								<span aria-hidden>/</span>
								<Link href={`/products#${category.id}`} className="hover:text-brand hover:underline">
									{category.name}
								</Link>
							</>
						)}
						<span aria-hidden>/</span>
						<span className="text-ink">{product.name}</span>
					</nav>

					<div className="grid gap-8 md:grid-cols-[minmax(0,340px)_1fr]">
						{/* ---- image ---- */}
						{product.image || category?.image ? (
							<Zoomable
								src={product.image || category?.image || ""}
								alt={product.name}
								className="aspect-square w-full rounded-xl border border-line bg-white object-cover shadow-sm"
							/>
						) : (
							<div className="grid aspect-square w-full place-items-center rounded-xl border border-line bg-linear-to-br from-[#fff7e6] to-[#fdeccb]">
								<CategoryIcon id={product.categoryId} className="h-20 w-20 text-brand" />
							</div>
						)}

						{/* ---- details ---- */}
						<div>
							{category && (
								<p className="mb-1 text-[13px] font-semibold uppercase tracking-wider text-brand">
									{category.name}
								</p>
							)}
							<h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
								{product.name}
								{soldOut && (
									<span className="ml-2 rounded-sm bg-[#fdecec] px-2 py-1 align-middle text-[13px] font-semibold text-brand">
										SOLD OUT
									</span>
								)}
							</h1>
							{product.content && <p className="mt-1 text-[16px] text-ink-soft">{product.content}</p>}

							<div className="mt-4 flex flex-wrap items-baseline gap-3">
								{product.price ? (
									<>
										<span className="text-3xl font-black text-brand">{money(product.price)}</span>
										{product.mrp > product.price && (
											<>
												<span className="text-lg text-muted line-through">{money(product.mrp)}</span>
												<span className="rounded-sm bg-[#eafbf0] px-2 py-1 text-[13px] font-semibold text-[#1a7f37]">
													{discountPct}% off
												</span>
											</>
										)}
									</>
								) : (
									<span className="text-xl font-semibold text-muted">Price on enquiry</span>
								)}
							</div>

							<p className="mt-4 text-[15px] leading-6 text-ink-soft">
								Direct from Sivakasi at wholesale rates, delivered to your nearest transport office
								across Chennai &amp; South India. Set a quantity below and send it on WhatsApp for a
								same-day estimate, or add it to your full order on the price list.
							</p>

							<div className="mt-5">
								<ProductOrderBox
									id={product.id}
									name={product.name}
									content={product.content}
									price={product.price}
									whatsapp={site.whatsapp}
									soldOut={soldOut}
								/>
							</div>

							<p className="mt-4 text-[14px] text-muted">
								Minimum order {money(site.minOrder)}.{" "}
								<Link href="/products" className="text-brand underline">
									See the full price list →
								</Link>
							</p>
						</div>
					</div>

					{/* ---- related products (same category, more crawl paths + real internal links) ---- */}
					{related.length > 0 && (
						<div className="mt-12">
							<h2 className="mb-4 border-b-2 border-brand pb-2 text-lg font-semibold text-ink">
								More {category?.name ?? "products"}
							</h2>
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
								{related.map((p) => (
									<Link
										key={p.id}
										href={`/products/${p.id}`}
										className="border border-line bg-white p-3 text-center transition-colors hover:border-brand"
									>
										{p.image || category?.image ? (
											// Plain <img>, not Zoomable — nesting its click-to-open-lightbox
											// handler inside this Link would fire both the modal and the
											// navigation on the same click.
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={p.image || category?.image || ""}
												alt={p.name}
												loading="lazy"
												className="mx-auto aspect-square w-full rounded border border-line object-cover"
											/>
										) : (
											<span className="mx-auto grid aspect-square w-full place-items-center rounded border border-line bg-linear-to-br from-[#fff7e6] to-[#fdeccb]">
												<CategoryIcon id={p.categoryId} className="h-8 w-8 text-brand" />
											</span>
										)}
										<span className="mt-2 block text-[13.5px] font-medium text-ink">{p.name}</span>
										<span className="block text-[13px] font-semibold text-brand">
											{p.price ? money(p.price) : "—"}
										</span>
									</Link>
								))}
							</div>
						</div>
					)}
				</div>
			</section>
		</>
	);
}
