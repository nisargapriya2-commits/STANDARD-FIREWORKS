import { NextRequest } from "next/server";
import { getProductImage } from "@/lib/catalog";
import { dataUrlResponse } from "@/lib/image-response";

export const runtime = "nodejs";

/** Serve an owner-uploaded product photo. See lib/image-response.ts for the why. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
	const { id } = await ctx.params;
	return dataUrlResponse(await getProductImage(id));
}
