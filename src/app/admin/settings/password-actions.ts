"use server";

import { redirect } from "next/navigation";
import { changePassword, requireAdmin } from "@/lib/admin-auth";

export async function changePasswordAction(formData: FormData) {
	await requireAdmin();
	const err = await changePassword(
		String(formData.get("currentPassword") || ""),
		String(formData.get("newPassword") || ""),
		String(formData.get("confirmPassword") || ""),
	);
	redirect(`/admin/settings?pw=${err ?? "ok"}#password`);
}
