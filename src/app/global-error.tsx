"use client";

/**
 * Last-resort boundary. `error.tsx` sits INSIDE the root layout, so if the layout
 * itself throws (header, fonts, getSettings at layout level) that boundary never
 * renders and the visitor gets a blank white page.
 *
 * This one replaces the whole document, which is why it must ship its own <html>
 * and <body>. Styling is inline on purpose — if the CSS failed to load, that could
 * be the very thing that broke, and Tailwind classes here would render as nothing.
 */

import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[global error]", { digest: error.digest, message: error.message });
	}, [error]);

	return (
		<html lang="en">
			<body
				style={{
					margin: 0,
					minHeight: "100vh",
					display: "grid",
					placeItems: "center",
					padding: "24px",
					background: "#1a0508",
					color: "#fff",
					fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
					textAlign: "center",
				}}
			>
				<div style={{ maxWidth: 460 }}>
					<div style={{ fontSize: 44 }}>🧨</div>
					<h1 style={{ margin: "16px 0 0", fontSize: 24 }}>The site is having a problem</h1>
					<p style={{ margin: "12px 0 0", lineHeight: 1.7, color: "rgba(255,255,255,0.78)" }}>
						Sorry — please try again in a moment. If it keeps happening, call us on{" "}
						<a href="tel:+919344170018" style={{ color: "#f5c542", fontWeight: 700 }}>
							+91 93441 70018
						</a>{" "}
						and we&apos;ll take your order directly.
					</p>
					<button
						onClick={reset}
						style={{
							marginTop: 24,
							padding: "12px 22px",
							fontSize: 16,
							fontWeight: 700,
							color: "#3a1a00",
							background: "linear-gradient(90deg,#f5c542,#eaa72a)",
							border: 0,
							borderRadius: 8,
							cursor: "pointer",
						}}
					>
						Try again
					</button>
					{error.digest && (
						<p style={{ marginTop: 26, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
							Reference: {error.digest}
						</p>
					)}
				</div>
			</body>
		</html>
	);
}
