"use client";

import { useEffect, useRef } from "react";

/**
 * Real particle-fireworks engine (canvas 2D). Rockets launch from the bottom,
 * arc up, then explode into gravity-affected, fading sparks with trails — the
 * fireworks.js-style effect, hand-rolled so there's no dependency.
 *
 * Design notes:
 *  - Sits absolutely behind the hero content (pointer-events:none, aria-hidden).
 *  - DPR-aware so bursts stay crisp on retina; re-measures on resize.
 *  - Pauses when the tab is hidden and when scrolled out of view (perf + battery).
 *  - Fully skipped for prefers-reduced-motion.
 *  - Canvas has no children → no SSR/hydration markup, safe in an RSC page.
 */

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number; // 1 → 0
	decay: number;
	color: string;
	trail: { x: number; y: number }[];
};

type Rocket = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	targetY: number;
	color: string;
	trail: { x: number; y: number }[];
};

const COLORS = [
	"#ffd54a", // gold
	"#ff6a1f", // ember orange
	"#ff2e88", // magenta
	"#4d8bff", // blue
	"#22c55e", // green
	"#fff2c4", // warm white
];

export default function FireworksCanvas({ className = "" }: { className?: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let W = 0;
		let H = 0;
		let dpr = 1;
		const resize = () => {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			const rect = canvas.getBoundingClientRect();
			W = rect.width;
			H = rect.height;
			canvas.width = Math.max(1, Math.floor(W * dpr));
			canvas.height = Math.max(1, Math.floor(H * dpr));
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();

		const rockets: Rocket[] = [];
		const particles: Particle[] = [];
		const rand = (a: number, b: number) => a + Math.random() * (b - a);
		const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

		const launch = () => {
			if (W === 0) return;
			const x = rand(W * 0.12, W * 0.88);
			rockets.push({
				x,
				y: H,
				vx: rand(-0.6, 0.6),
				vy: rand(-9.2, -7.4),
				targetY: rand(H * 0.12, H * 0.42),
				color: pick(COLORS),
				trail: [],
			});
		};

		const explode = (x: number, y: number, color: string) => {
			const count = Math.floor(rand(26, 46));
			const speed = rand(2.4, 4.6);
			const gold = Math.random() < 0.5;
			for (let i = 0; i < count; i++) {
				const angle = (Math.PI * 2 * i) / count + rand(-0.12, 0.12);
				const s = speed * rand(0.4, 1);
				particles.push({
					x,
					y,
					vx: Math.cos(angle) * s,
					vy: Math.sin(angle) * s,
					life: 1,
					decay: rand(0.008, 0.018),
					color: gold ? pick(["#ffd54a", "#fff2c4", "#f6a41c"]) : color,
					trail: [],
				});
			}
		};

		const GRAVITY = 0.045;
		const FRICTION = 0.985;
		let frame = 0;
		let raf = 0;
		let running = true;

		const tick = () => {
			raf = requestAnimationFrame(tick);
			frame++;

			// Trails fade by ERASING the canvas's own pixels, not by painting a dark
			// veil over them — a veil is opaque to whatever sits behind the canvas and
			// would progressively black out the hero background image.
			ctx.globalCompositeOperation = "destination-out";
			ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
			ctx.fillRect(0, 0, W, H);
			ctx.globalCompositeOperation = "lighter";

			// Auto-launch cadence (throttled).
			if (frame % 34 === 0 || (rockets.length === 0 && particles.length < 40 && frame % 12 === 0)) {
				launch();
			}

			for (let i = rockets.length - 1; i >= 0; i--) {
				const r = rockets[i];
				r.x += r.vx;
				r.y += r.vy;
				r.vy += GRAVITY * 2.6;
				r.trail.push({ x: r.x, y: r.y });
				if (r.trail.length > 6) r.trail.shift();

				ctx.beginPath();
				ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
				ctx.fillStyle = r.color;
				ctx.fill();
				for (let t = 0; t < r.trail.length; t++) {
					const p = r.trail[t];
					ctx.beginPath();
					ctx.arc(p.x, p.y, (t / r.trail.length) * 1.6, 0, Math.PI * 2);
					ctx.fillStyle = r.color;
					ctx.globalAlpha = (t / r.trail.length) * 0.5;
					ctx.fill();
					ctx.globalAlpha = 1;
				}

				if (r.vy >= -1.2 || r.y <= r.targetY) {
					explode(r.x, r.y, r.color);
					rockets.splice(i, 1);
				}
			}

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.vx *= FRICTION;
				p.vy *= FRICTION;
				p.vy += GRAVITY;
				p.x += p.vx;
				p.y += p.vy;
				p.life -= p.decay;
				if (p.life <= 0) {
					particles.splice(i, 1);
					continue;
				}
				ctx.beginPath();
				ctx.arc(p.x, p.y, 1.8 * p.life + 0.4, 0, Math.PI * 2);
				ctx.fillStyle = p.color;
				ctx.globalAlpha = Math.max(0, p.life);
				ctx.fill();
				ctx.globalAlpha = 1;
			}
		};

		const start = () => {
			if (!running) return;
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(tick);
		};
		const stop = () => cancelAnimationFrame(raf);

		// Pause when tab hidden or hero scrolled off screen.
		const onVis = () => (document.hidden ? stop() : start());
		document.addEventListener("visibilitychange", onVis);

		const io = new IntersectionObserver(
			(entries) => {
				running = entries[0]?.isIntersecting ?? true;
				running && !document.hidden ? start() : stop();
			},
			{ threshold: 0 },
		);
		io.observe(canvas);

		const onResize = () => resize();
		window.addEventListener("resize", onResize);

		start();

		return () => {
			stop();
			document.removeEventListener("visibilitychange", onVis);
			window.removeEventListener("resize", onResize);
			io.disconnect();
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden
			className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
		/>
	);
}
