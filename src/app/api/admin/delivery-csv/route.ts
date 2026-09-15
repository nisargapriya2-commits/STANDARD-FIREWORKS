import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { getSettings } from "@/lib/catalog";
import { buildDeliveryCsv } from "@/lib/delivery-csv";

/**
 * Downloads the CURRENT State → City → Area delivery list as a CSV — this doubles
 * as the "template" the owner edits in Excel and re-uploads via the bulk-import
 * form in Admin → Settings. Starting from the real data (instead of a blank
 * template) means they can add a few rows without retyping everything.
 */
export async function GET() {
	if (!(await isAuthed())) return new NextResponse("Not found", { status: 404 });

	const settings = await getSettings();
	const csv = buildDeliveryCsv(settings);
	return new NextResponse(csv, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="delivery-areas.csv"',
			"Cache-Control": "no-store",
		},
	});
}
