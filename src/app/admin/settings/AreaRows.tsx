"use client";

import { useState } from "react";
import type { ServiceArea } from "@/lib/site";
import { aHint } from "@/lib/admin-ui";

const cell =
	"w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px] text-ink outline-none focus:border-brand";

/**
 * The area rows for one city, with no cap on how many the owner can add.
 *
 * Inputs are UNCONTROLLED (defaultValue) and keyed by a stable row id, so the
 * DOM node — and whatever the owner has typed into it — survives adding or
 * removing a row above it. The `::<i>::` in the field name is only a slot
 * number for the server; it re-numbers as rows move, which is fine because the
 * server rebuilds the list from whatever comes back non-blank, in order.
 */
export default function AreaRows({
	base,
	areas,
}: {
	/** Field-name prefix — `area::<state>::<city>` */
	base: string;
	areas: ServiceArea[];
}) {
	// Always show one blank row at the end so "add an area" needs no clicking.
	const [rows, setRows] = useState<{ id: number; area?: ServiceArea }[]>(() => [
		...areas.map((area, i) => ({ id: i, area })),
		{ id: areas.length },
	]);
	const [nextId, setNextId] = useState(areas.length + 1);

	const add = () => {
		setRows((r) => [...r, { id: nextId }]);
		setNextId((n) => n + 1);
	};

	// Never leave the city with zero rows — the owner would have nothing to type into.
	const remove = (id: number) =>
		setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r));

	return (
		<div className="mt-2 space-y-2">
			{rows.map((row, i) => (
				<div
					key={row.id}
					className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
				>
					<input
						name={`${base}::${i}::name`}
						defaultValue={row.area?.name ?? ""}
						placeholder={i === 0 ? "Area name, e.g. Anna Nagar" : "Area name"}
						className={cell}
					/>
					<input
						name={`${base}::${i}::map`}
						defaultValue={row.area?.mapUrl ?? ""}
						placeholder="Google Maps link, e.g. https://maps.app.goo.gl/…"
						className={cell}
					/>
					<input type="hidden" name={`${base}::${i}::address`} defaultValue={row.area?.address ?? ""} />
					<input type="hidden" name={`${base}::${i}::pincode`} defaultValue={row.area?.pincode ?? ""} />
					<button
						type="button"
						onClick={() => remove(row.id)}
						aria-label="Remove this area"
						title="Remove this area"
						className="rounded-lg border border-line px-3 py-2 text-[15px] font-semibold text-muted hover:border-red-300 hover:bg-red-50 hover:text-red-600"
					>
						✕
					</button>
				</div>
			))}

			<button
				type="button"
				onClick={add}
				className="rounded-lg border border-dashed border-brand/50 px-3 py-2 text-[14.5px] font-semibold text-brand hover:bg-brand/5"
			>
				+ Add another area
			</button>
			<p className={aHint}>
				Add as many areas as you like. Press <b>Save changes</b> at the bottom when you&apos;re done.
			</p>
		</div>
	);
}
