import { requireAdmin } from "@/lib/admin-auth";
import { getCatalog } from "@/lib/catalog";
import ProductEditor from "./ProductEditor";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
	await requireAdmin();
	const catalog = await getCatalog();

	return (
		<div>
			<h1 className="text-[26px] font-extrabold text-ink">Products &amp; prices</h1>
			<p className="mb-6 mt-1 text-[15px] text-muted">
				Set your prices, edit names, or hide items. Changes show on the website straight away.
				<br />
				<b className="text-ink-soft">Old price</b> = the crossed-out price · <b className="text-ink-soft">Your price</b> = what the customer actually pays.
			</p>
			<ProductEditor categories={catalog.categories} products={catalog.products} />
		</div>
	);
}
