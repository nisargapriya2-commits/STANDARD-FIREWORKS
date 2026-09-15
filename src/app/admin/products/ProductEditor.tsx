"use client";

import { useEffect, useMemo, useState } from "react";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	KeyboardSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
	sortableKeyboardCoordinates,
	arrayMove,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LINES, type CatCategory, type CatProduct, type LineId } from "@/lib/catalog-types";
import {
	saveProductAction,
	deleteProductAction,
	createProductAction,
	createCategoryAction,
	renameCategoryAction,
	deleteCategoryAction,
	saveCategoryImageAction,
	reorderProductsAction,
	reorderCategoriesAction,
} from "./actions";
import PhotoPicker from "../PhotoPicker";
import { SaveButton } from "../SaveButton";

export default function ProductEditor({
	categories,
	products,
}: {
	categories: CatCategory[];
	products: CatProduct[];
}) {
	const [line, setLine] = useState<LineId>("standard");
	// Default straight into the first category (not "All") so the drag handle
	// is already active on load — reordering only works within one category,
	// and picking one shouldn't be a separate step before you can drag.
	const [catId, setCatId] = useState<string>(
		() => categories.find((c) => c.line === "standard")?.id ?? "all",
	);
	const [adding, setAdding] = useState(false);
	const [mgmt, setMgmt] = useState(false);

	const cats = useMemo(() => categories.filter((c) => c.line === line), [categories, line]);
	const shown = useMemo(
		() =>
			products.filter(
				(p) => p.line === line && (catId === "all" || p.categoryId === catId),
			),
		[products, line, catId],
	);

	// Local, reorderable copy of `shown` — dragging updates this immediately
	// (so the row moves right away) while the save happens in the background.
	// Re-syncs whenever the underlying filter/data changes.
	const [ordered, setOrdered] = useState(shown);
	useEffect(() => setOrdered(shown), [shown]);

	// Reordering only makes sense within ONE category (that's how `sort` is
	// scoped server-side) — dragging is disabled in "All categories" view.
	const dragDisabled = catId === "all";

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setOrdered((items) => {
			const oldIndex = items.findIndex((p) => p.id === active.id);
			const newIndex = items.findIndex((p) => p.id === over.id);
			const next = arrayMove(items, oldIndex, newIndex);
			reorderProductsAction(catId, next.map((p) => p.id)).catch(console.error);
			return next;
		});
	}

	// Same drag-and-drop pattern as products, but for the category list itself
	// (Manage categories panel) — scoped to the current line, like `sort` is.
	const [orderedCats, setOrderedCats] = useState(cats);
	useEffect(() => setOrderedCats(cats), [cats]);

	function handleCategoryDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setOrderedCats((items) => {
			const oldIndex = items.findIndex((c) => c.id === active.id);
			const newIndex = items.findIndex((c) => c.id === over.id);
			const next = arrayMove(items, oldIndex, newIndex);
			reorderCategoriesAction(line, next.map((c) => c.id)).catch(console.error);
			return next;
		});
	}

	return (
		<div>
			{/* line toggle */}
			<div className="mb-4 flex flex-wrap gap-2">
				{LINES.map((l) => (
					<button
						key={l.id}
						onClick={() => {
							setLine(l.id);
							setCatId(categories.find((c) => c.line === l.id)?.id ?? "all");
						}}
						className={`rounded-lg px-4 py-2.5 text-[15px] font-semibold ${
							line === l.id ? "bg-brand text-white shadow-sm" : "border border-line bg-white text-ink-soft hover:bg-row"
						}`}
					>
						{l.name} <span className="opacity-60">({l.sub})</span>
					</button>
				))}
			</div>

			{/* category filter + add */}
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<select
					value={catId}
					onChange={(e) => setCatId(e.target.value)}
					className="rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink"
				>
					<option value="all">
						All categories ({products.filter((p) => p.line === line).length})
					</option>
					{cats.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name} ({products.filter((p) => p.categoryId === c.id).length})
						</option>
					))}
				</select>
				<button
					onClick={() => setMgmt((v) => !v)}
					className="ml-auto rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-row"
				>
					{mgmt ? "Close categories" : "Manage categories"}
				</button>
				<button
					onClick={() => setAdding((v) => !v)}
					className="rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-row"
				>
					{adding ? "Close" : "+ Add product"}
				</button>
			</div>

			{dragDisabled && (
				<p className="mb-3 text-[13px] text-muted">
					Tip: pick one category above, then drag the <b>⠿</b> handle on the left of any
					product to drag and drop it into the order you want.
				</p>
			)}

			{/* category management */}
			{mgmt && (
				<div className="mb-5 rounded-xl border border-line bg-row p-4">
					<h3 className="mb-1 text-[15px] font-bold text-ink">
						{LINES.find((l) => l.id === line)?.name} categories
					</h3>
					<p className="mb-3 text-[13px] text-muted">
						The picture you add here is used on the home page and at the top of that category
						on the price list — and for any product in it that has no photo of its own. Drag the{" "}
						<b>⠿</b> handle to change the order categories appear in.
					</p>
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
						<SortableContext items={orderedCats.map((c) => c.id)} strategy={verticalListSortingStrategy}>
							<div className="space-y-2">
								{orderedCats.map((c) => {
									const count = products.filter((p) => p.categoryId === c.id).length;
									return <SortableCategoryRow key={c.id} c={c} count={count} />;
								})}
							</div>
						</SortableContext>
					</DndContext>
					<form action={createCategoryAction} className="mt-3 flex items-center gap-2 border-t border-line pt-3">
						<input type="hidden" name="line" value={line} />
						<input name="name" required placeholder="New category name" className={cell} />
						<button className="rounded-lg bg-emerald-600 px-3 py-2 text-[14px] font-semibold text-white hover:brightness-110">
							+ Add category
						</button>
					</form>
				</div>
			)}

			{/* add form */}
			{adding && (
				<form
					action={createProductAction}
					className="mb-5 grid gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 sm:grid-cols-[1fr_140px_90px_90px_auto]"
				>
					<input type="hidden" name="line" value={line} />
					<input
						name="name"
						required
						placeholder="Product name"
						className={cell}
					/>
					<input name="content" placeholder="Pack (e.g. 10 PCS · 1 Box)" className={cell} />
					<input name="mrp" type="number" min={0} placeholder="Old price" className={cell} />
					<input name="price" type="number" min={0} placeholder="Your price" className={cell} />
					<div className="flex items-center gap-2">
						<select name="categoryId" required className={cell}>
							{cats.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</select>
						<button className="rounded-lg bg-emerald-600 px-3 py-2.5 text-[14px] font-semibold text-white hover:brightness-110">
							Add
						</button>
					</div>
				</form>
			)}

			{/* editable rows */}
			<div className="hidden grid-cols-[28px_132px_1fr_130px_84px_84px_64px_84px_120px] gap-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-muted sm:grid">
				<span></span>
				<span>Photo</span>
				<span>Product name</span>
				<span>Pack</span>
				<span>Old price ₹</span>
				<span>Your price ₹</span>
				<span>Show</span>
				<span>Stock</span>
				<span></span>
			</div>
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={ordered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
					<div className="mt-2 space-y-2">
						{ordered.map((p) => (
							<SortableProductRow key={p.id} p={p} dragDisabled={dragDisabled} />
						))}
						{ordered.length === 0 && (
							<p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-[15px] text-muted">
								No products in this filter.
							</p>
						)}
					</div>
				</SortableContext>
			</DndContext>
			<p className="mt-3 text-[13px] text-muted">
				Tip: <b className="text-ink-soft">Photo</b> — click the box on the left of any product and pick a
				picture from your phone or computer. It saves and goes live by itself; there is no size limit to
				worry about, we shrink it for you. Click <b>remove</b> to go back to the drawn icon.
				<br />
				Tip: <b className="text-ink-soft">Stock</b> — leave it as <b>−1</b> for &ldquo;always available&rdquo;, or set <b>0</b> to show &ldquo;Sold out&rdquo;.
				<br />
				Tip: <b className="text-ink-soft">⠿</b> — press and drag to reorder. This is the order customers see it in on the price list. Works with a finger on your phone too.
			</p>
		</div>
	);
}

function SortableCategoryRow({ c, count }: { c: CatCategory; count: number }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: c.id,
	});
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1 : "auto",
	};

	return (
		<div ref={setNodeRef} style={style} className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				{...attributes}
				{...listeners}
				title="Drag to reorder"
				className="touch-none rounded-lg border border-line px-1.5 py-2 text-[16px] leading-none text-muted hover:bg-row active:cursor-grabbing sm:cursor-grab"
			>
				⠿
			</button>
			<form action={saveCategoryImageAction} className="flex items-center">
				<input type="hidden" name="id" value={c.id} />
				<PhotoPicker alt={c.name} current={c.image} size={48} />
			</form>
			<form action={renameCategoryAction} className="flex flex-1 items-center gap-2">
				<input type="hidden" name="id" value={c.id} />
				<input name="name" defaultValue={c.name} className={cell} />
				<button className="rounded-lg bg-brand px-3 py-2 text-[14px] font-semibold text-white hover:brightness-110">
					Rename
				</button>
			</form>
			<span className="text-[13px] text-muted">{count} products</span>
			<form action={deleteCategoryAction}>
				<input type="hidden" name="id" value={c.id} />
				<button
					disabled={count > 0}
					title={count > 0 ? "Empty the category first" : "Delete category"}
					className="rounded-lg border border-red-300 px-2.5 py-2 text-[14px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
				>
					Delete
				</button>
			</form>
		</div>
	);
}

function SortableProductRow({ p, dragDisabled }: { p: CatProduct; dragDisabled: boolean }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: p.id,
		disabled: dragDisabled,
	});
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1 : "auto",
	};

	return (
		<form
			ref={setNodeRef}
			style={style}
			action={saveProductAction}
			className="grid items-center gap-2 rounded-xl border border-line bg-white p-2.5 shadow-sm sm:grid-cols-[28px_132px_1fr_130px_84px_84px_64px_84px_120px]"
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				disabled={dragDisabled}
				title={dragDisabled ? "Pick one category above to reorder" : "Drag to reorder"}
				className="touch-none rounded-lg border border-line px-1.5 py-2 text-[16px] leading-none text-muted hover:bg-row active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30 sm:cursor-grab"
			>
				⠿
			</button>
			<input type="hidden" name="id" value={p.id} />
			<PhotoPicker alt={p.name} current={p.image} />
			<input name="name" defaultValue={p.name} className={cell} />
			<input name="content" defaultValue={p.content} className={cell} />
			<input name="mrp" type="number" min={0} defaultValue={p.mrp} className={cell} />
			<input name="price" type="number" min={0} defaultValue={p.price} className={cell} />
			<label className="flex items-center gap-1.5 text-[14px] text-ink-soft">
				<input type="checkbox" name="active" defaultChecked={p.active} className="h-4 w-4 accent-[var(--color-brand)]" /> On
			</label>
			<input
				name="stock"
				type="number"
				defaultValue={p.stock}
				title="-1 = always available, 0 = sold out"
				className={cell}
			/>
			<div className="flex gap-1.5 items-center">
				<SaveButton
					label="Save"
					pendingLabel="Saving..."
					savedLabel="Saved ✓"
					className="flex-1 rounded-lg bg-brand px-2 py-2 text-[14px] font-semibold text-white hover:brightness-110"
				/>
				<button
					formAction={deleteProductAction}
					className="rounded-lg border border-red-300 px-2.5 py-2 text-[14px] font-semibold text-red-600 hover:bg-red-50"
					title="Delete"
				>
					✕
				</button>
			</div>
		</form>
	);
}

const cell =
	"w-full rounded-lg border border-line bg-white px-3 py-2 text-[15px] text-ink outline-none focus:border-brand";
