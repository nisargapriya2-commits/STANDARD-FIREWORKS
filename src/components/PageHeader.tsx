import Fireworks from "@/components/Fireworks";
import { HangingLamp } from "@/components/icons";

/**
 * Shared page banner. Uses the same night-sky + fireworks + ember animation as
 * the home hero so every page feels like one festive site.
 */
export default function PageHeader({
	title,
	subtitle,
}: {
	title: string;
	subtitle?: string;
}) {
	return (
		<section className="night-bg relative overflow-hidden py-14 text-white">
			<Fireworks />
			{/* hanging diyas across the top, matching the home hero */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-around px-8 text-yellow opacity-90"
			>
				{Array.from({ length: 7 }).map((_, i) => (
					<span key={i} className="diya-glow" style={{ animationDelay: `${(i % 3) * 0.3}s` }}>
						<HangingLamp className="h-9 w-4" />
					</span>
				))}
			</div>
			<div className="relative z-10 mx-auto max-w-292.5 px-4">
				<h1 className="gold-ink underline-spark text-3xl font-black sm:text-5xl">{title}</h1>
				{subtitle && (
					<p className="mt-5 max-w-2xl text-[17px] leading-7 text-white/85">{subtitle}</p>
				)}
			</div>
		</section>
	);
}
