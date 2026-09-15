"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteOrder } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

export async function deleteOrderAction(id: string): Promise<{ success: boolean; error?: string }> {
	try {
		await requireAdmin();
		if (!id || typeof id !== "string") {
			return { success: false, error: "Missing or invalid order ID." };
		}

		const cleanId = id.trim();
		// Permanently delete order and any related coupon records from database
		await deleteOrder(cleanId);

		// Clean up any generated static invoice file on disk if present
		try {
			const invoicePath = path.join(process.cwd(), "public", `Invoice-${cleanId}.pdf`);
			if (fs.existsSync(invoicePath)) {
				fs.unlinkSync(invoicePath);
			}
		} catch (fileErr) {
			// Non-blocking in serverless/edge environments where fs is read-only
			console.warn("Could not delete static invoice file:", fileErr);
		}

		// Revalidate admin views
		revalidatePath("/admin");
		revalidatePath("/admin/orders");
		revalidatePath(`/admin/orders/${cleanId}`);
		revalidatePath("/admin/coupons");

		return { success: true };
	} catch (err) {
		console.error("Failed to delete order permanently:", err);
		return {
			success: false,
			error: (err as Error)?.message || "Failed to permanently delete the order.",
		};
	}
}
