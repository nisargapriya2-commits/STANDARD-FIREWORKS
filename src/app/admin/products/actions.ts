"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
	updateProduct,
	setProductImage,
	setCategoryImage,
	deleteProduct,
	createProduct,
	createCategory,
	renameCategory,
	deleteCategory,
	reorderProducts,
	reorderCategories,
} from "@/lib/catalog";
import type { LineId } from "@/lib/catalog-types";

function refresh() {
	revalidatePath("/admin/products");
	revalidatePath("/products");
	revalidatePath("/checkout");
}

export async function saveProductAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	if (!id) return;
	const stockRaw = formData.get("stock");
	await updateProduct(id, {
		name: String(formData.get("name") || "").trim(),
		content: String(formData.get("content") || "").trim(),
		mrp: Math.max(0, Math.floor(Number(formData.get("mrp")) || 0)),
		price: Math.max(0, Math.floor(Number(formData.get("price")) || 0)),
		active: formData.get("active") === "on",
		stock: stockRaw === null || stockRaw === "" ? -1 : Math.floor(Number(stockRaw)),
	});
	// Only touch the photo when the row actually changed it — a price edit shouldn't
	// re-post (or wipe) the image.
	if (formData.get("imageChanged") === "1") {
		const image = String(formData.get("image") || "");
		if (image === "" || /^data:image\/(jpeg|png|webp);base64,/.test(image)) {
			await setProductImage(id, image);
		}
	}
	refresh();
}

/**
 * Called directly (not via a <form>) from the drag-and-drop handler in
 * ProductEditor once the owner drops a row in its new place.
 */
export async function reorderProductsAction(categoryId: string, orderedIds: string[]) {
	await requireAdmin();
	if (categoryId && orderedIds.length) await reorderProducts(categoryId, orderedIds);
	refresh();
}

/**
 * Called directly (not via a <form>) from the drag-and-drop handler for the
 * "Manage categories" list once the owner drops a category in its new place.
 */
export async function reorderCategoriesAction(line: LineId, orderedIds: string[]) {
	await requireAdmin();
	if (orderedIds.length) await reorderCategories(line, orderedIds);
	refresh();
}

export async function deleteProductAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	if (id) await deleteProduct(id);
	refresh();
}

export async function createProductAction(formData: FormData) {
	await requireAdmin();
	const categoryId = String(formData.get("categoryId") || "");
	const line = String(formData.get("line") || "standard") as LineId;
	const name = String(formData.get("name") || "").trim();
	if (!categoryId || !name) return;
	await createProduct({
		categoryId,
		line,
		name,
		content: String(formData.get("content") || "").trim(),
		mrp: Math.max(0, Math.floor(Number(formData.get("mrp")) || 0)),
		price: Math.max(0, Math.floor(Number(formData.get("price")) || 0)),
	});
	refresh();
}

export async function createCategoryAction(formData: FormData) {
	await requireAdmin();
	const line = String(formData.get("line") || "standard") as LineId;
	const name = String(formData.get("name") || "").trim();
	if (name) await createCategory(line, name);
	refresh();
}

export async function renameCategoryAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	const name = String(formData.get("name") || "").trim();
	if (id && name) await renameCategory(id, name);
	refresh();
}

export async function saveCategoryImageAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	if (!id || formData.get("imageChanged") !== "1") return;
	const image = String(formData.get("image") || "");
	if (image === "" || /^data:image\/(jpeg|png|webp);base64,/.test(image)) {
		await setCategoryImage(id, image);
		refresh();
		revalidatePath("/");
	}
}

export async function deleteCategoryAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	if (id) await deleteCategory(id); // no-op if it still has products
	refresh();
}
