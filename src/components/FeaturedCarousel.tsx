"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CategoryIcon, ChevronIcon, SparkBurst } from "@/components/icons";
import Zoomable from "@/components/Zoomable";

/** `image` = owner-uploaded category photo URL, "" → the drawn icon is used. */
type Item = { id: string; name: string; image: string };

/**
 * One-item-at-a-time featured carousel. Auto-advances every 4.5s, pauses on
 * hover/focus, and has prev/next arrows + dots. Keeps the landing page short
 * (one slide tall instead of an 8-tile grid). Reduced-motion: no autoplay,
 * instant slide.
 */
export default function FeaturedCarousel({
	items,
	discountPct,
}: {
	items: Item[];
	discountPct: number;
}) {
	const n = items.length;
	const [i, setI] = useState(0);
	const paused = useRef(false);
	const [reduce, setReduce] = useState(false);

	const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

	useEffect(() => {
		const m = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduce(m.matches);
		if (m.matches || n <= 1) return;
		const t = setInterval(() => {
			if (!paused.current) setI((p) => (p + 1) % n);
		}, 4500);
		return () => clearInterval(t);
	}, [n]);

	return (
		<div
			className="relative"
			onMouseEnter={() => (paused.current = true)}
			onMouseLeave={() => (paused.current = false)}
			onFocusCapture={() => (paused.current = true)}
			onBlurCapture={() => (paused.current = false)}
			role="region"
			aria-roledescription="carousel"
			aria-label="Featured cracker categories"
		>
			<div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
				<div
					className="flex"
					style={{
						transform: `translateX(-${i * 100}%)`,
						transition: reduce ? "none" : "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
					}}
				>
					{items.map((c, k) => (
						<div
							key={c.id}
							className="w-full flex-none"
							aria-hidden={k !== i}
							role="group"
							aria-roledescription="slide"
							aria-label={`${k + 1} of ${n}: ${c.name}`}
						>
							<div className="grid grid-cols-1 sm:grid-cols-[1fr_1.15fr]">
								<div className="flex aspect-16/10 items-center justify-center overflow-hidden bg-linear-to-br from-[#fff7e6] to-[#fdeccb]">
									{c.image ? (
										// The owner's own category photo (admin → Products → Manage categories).
										<Zoomable
											src={c.image}
											alt={c.name}
											loading={k === 0 ? "eager" : "lazy"}
											className="h-full w-full object-cover"
										/>
									) : (
										<CategoryIcon id={c.id} className="h-28 w-28 text-brand" />
									)}
								</div>
								<div className="flex flex-col justify-center gap-3 p-7 sm:p-9">
									<p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-brand">
										Featured this season
									</p>
									<h3 className="text-2xl font-bold text-ink sm:text-3xl">{c.name}</h3>
									<p className="max-w-md text-[15.5px] leading-7 text-muted">
										Real Sivakasi {c.name.toLowerCase()} at wholesale rates — flat{" "}
										{discountPct}% off the printed list price.
									</p>
									{/*
										"Order Now" goes to this category on the PRICE LIST, not WhatsApp —
										the customer should see rates and build a list before talking to anyone.
										This used to sit beside a "View prices →" button; once both point at the
										same place one of them is just noise, so the weaker one is gone.
									*/}
									<div className="mt-1 flex flex-wrap items-center gap-3">
										<Link href={`/products#${c.id}`} className="btn-yellow shimmer">
											<SparkBurst className="h-4 w-4" /> Order Now
										</Link>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* arrows */}
			<button
				type="button"
				onClick={() => go(-1)}
				aria-label="Previous item"
				className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/95 text-brand shadow-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:-left-4"
			>
				<ChevronIcon className="h-5 w-5" />
			</button>
			<button
				type="button"
				onClick={() => go(1)}
				aria-label="Next item"
				className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/95 text-brand shadow-md transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:-right-4"
			>
				<ChevronIcon className="h-5 w-5 rotate-180" />
			</button>

			{/* dots */}
			<div className="mt-5 flex justify-center gap-2">
				{items.map((c, k) => (
					<button
						key={c.id}
						type="button"
						onClick={() => setI(k)}
						aria-label={`Show ${c.name}`}
						aria-current={k === i}
						className={`h-2.5 rounded-full transition-all ${
							k === i ? "w-6 bg-brand" : "w-2.5 bg-line hover:bg-brand/40"
						}`}
					/>
				))}
			</div>
		</div>
	);
}
