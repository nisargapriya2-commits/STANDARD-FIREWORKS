import { NextRequest } from "next/server";
import { getCategoryImage } from "@/lib/catalog";
import { dataUrlResponse } from "@/lib/image-response";

export const runtime = "nodejs";

/** Serve an owner-uploaded category photo. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	const { id } = await ctx.params;
	return dataUrlResponse(await getCategoryImage(id));
}
