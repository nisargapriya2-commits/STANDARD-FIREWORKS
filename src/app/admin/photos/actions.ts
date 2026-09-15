"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
	addSiteImage,
	setSingleSiteImage,
	deleteSiteImage,
	updateSiteImageCaption,
	moveSiteImage,
} from "@/lib/catalog";
import { SITE_IMAGE_GROUPS, type SiteImageGroup } from "@/lib/catalog-types";

/** Pictures show up on the public pages, so refresh those too. */
function refresh() {
	revalidatePath("/admin/photos");
	revalidatePath("/");
	revalidatePath("/about");
}

const isImage = (s: string) => /^data:image\/(jpeg|png|webp);base64,/.test(s);

function groupOf(formData: FormData): SiteImageGroup | null {
	const g = String(formData.get("group") || "");
	return (SITE_IMAGE_GROUPS as readonly string[]).includes(g) ? (g as SiteImageGroup) : null;
}

/** The shop logo — one picture, replaced each time. */
export async function saveLogoAction(formData: FormData) {
	await requireAdmin();
	if (formData.get("imageChanged") !== "1") return;
	const image = String(formData.get("image") || "");
	if (image !== "" && !isImage(image)) return;
	await setSingleSiteImage("logo", image);
	refresh();
}

/** Add one picture to a list (About photos, home banners). */
export async function addPhotoAction(formData: FormData) {
	await requireAdmin();
	const group = groupOf(formData);
	const image = String(formData.get("image") || "");
	if (!group || formData.get("imageChanged") !== "1" || !isImage(image)) return;
	await addSiteImage(group, image, String(formData.get("caption") || "").trim());
	refresh();
}

export async function deletePhotoAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	if (id) await deleteSiteImage(id);
	refresh();
}

export async function savePhotoCaptionAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	if (id) await updateSiteImageCaption(id, String(formData.get("caption") || "").trim());
	refresh();
}

export async function movePhotoAction(formData: FormData) {
	await requireAdmin();
	const id = String(formData.get("id") || "");
	const dir = String(formData.get("dir") || "") === "up" ? "up" : "down";
	if (id) await moveSiteImage(id, dir);
	refresh();
}
