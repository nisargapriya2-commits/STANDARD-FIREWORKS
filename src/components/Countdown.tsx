"use client";

import { useEffect, useState } from "react";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Live countdown to a festival date, rendered as a mechanical flip-clock
 * (one tile per digit group, flipping in place as each unit ticks over).
 * Renders nothing until mounted (and nothing once the date has passed) — the
 * placeholder-then-fill pattern avoids a hydration mismatch, since the server
 * has no concept of "now" for a ticking clock.
 */
export default function Countdown({ target, label }: { target: string; label: string }) {
	const targetMs = new Date(target).getTime();
	const [now, setNow] = useState<number | null>(null);

	useEffect(() => {
		if (!Number.isFinite(targetMs)) return;
		setNow(Date.now());
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [targetMs]);

	if (now === null || !Number.isFinite(targetMs)) return null;
	const diff = targetMs - now;
	if (diff <= 0) return null;

	const days = Math.floor(diff / 86400000);
	const hours = Math.floor((diff % 86400000) / 3600000);
	const mins = Math.floor((diff % 3600000) / 60000);
	const secs = Math.floor((diff % 60000) / 1000);

	return (
		<div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
			<span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow/80 sm:text-[13px]">
				⏳ Counting down to {label}
			</span>
			<FlipUnit value={days} unitLabel="Days" />
			<span className="flip-sep">:</span>
			<FlipUnit value={hours} unitLabel="Hrs" />
			<span className="flip-sep">:</span>
			<FlipUnit value={mins} unitLabel="Min" />
			<span className="flip-sep">:</span>
			<FlipUnit value={secs} unitLabel="Sec" />
		</div>
	);
}

function FlipUnit({ value, unitLabel }: { value: number; unitLabel: string }) {
	const display = pad2(value);
	return (
		<div className="flex flex-col items-center gap-1">
			{/* key={display} forces a remount on every change, replaying the flip animation */}
			<div key={display} className="flip-card">
				{display}
			</div>
			<span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gold/70 sm:text-[10px]">
				{unitLabel}
			</span>
		</div>
	);
}
