"use client";

/**
 * Shared cart store — lets the Products page and the /checkout page use the
 * SAME selection. Persisted to localStorage so it survives navigation + refresh.
 *
 * This is an ENQUIRY/ESTIMATE cart, not e-commerce checkout. No payment is taken
 * on the site (firecracker law). Payment is manual (UPI/bank) and the customer
 * uploads the receipt screenshot at checkout; the owner verifies it in the admin panel.
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type CatProduct } from "@/lib/catalog-types";

export type Qty = Record<string, number>;

type CartValue = {
	qty: Qty;
	ready: boolean; // false until localStorage has been read (avoids hydration flns)
	setQty: (id: string, n: number) => void;
	clear: () => void;
};

const CartCtx = createContext<CartValue | null>(null);
const STORAGE_KEY = "sf-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
	const [qty, setQtyState] = useState<Qty>({});
	const [ready, setReady] = useState(false);

	// Load once on mount.
	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) setQtyState(JSON.parse(raw));
		} catch {
			/* ignore corrupt / unavailable storage */
		}
		setReady(true);
	}, []);

	// Persist on change (only after the initial load).
	useEffect(() => {
		if (!ready) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(qty));
		} catch {
			/* ignore */
		}
	}, [qty, ready]);

	const value = useMemo<CartValue>(
		() => ({
			qty,
			ready,
			setQty: (id, n) =>
				setQtyState((q) => ({ ...q, [id]: Number.isFinite(n) && n > 0 ? Math.floor(n) : 0 })),
			clear: () => setQtyState({}),
		}),
		[qty, ready],
	);

	return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
	const ctx = useContext(CartCtx);
	if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
	return ctx;
}

/* ---- derived selectors (pure — take the product list from the server) ---- */

export type CartLine = {
	product: CatProduct;
	qty: number;
	unit: number; // selling price per unit (0 if price not set yet)
	total: number;
};

export function selectedItems(qty: Qty, all: CatProduct[]): CartLine[] {
	return all
		.filter((p) => (qty[p.id] ?? 0) > 0)
		.map((p) => {
			const q = qty[p.id];
			return { product: p, qty: q, unit: p.price, total: p.price * q };
		});
}

export function cartTotals(qty: Qty, all: CatProduct[]) {
	let items = 0;
	let list = 0;
	let net = 0;
	let priced = 0; // how many lines actually have a price
	for (const p of all) {
		const q = qty[p.id] ?? 0;
		if (!q) continue;
		items += q;
		if (p.price > 0) {
			priced += 1;
			list += p.mrp * q;
			net += p.price * q;
		}
	}
	return { items, list, net, save: list - net, priced };
}
