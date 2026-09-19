"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

const FB_PIXEL_ID = "1409479427943084";

declare global {
	interface Window {
		fbq?: (...args: unknown[]) => void;
		_fbq?: unknown;
	}
}

function MetaPixelTracker() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		// Do not track admin route visits
		if (!pathname || pathname.startsWith("/admin")) {
			return;
		}

		if (typeof window.fbq === "function") {
			window.fbq("track", "PageView");
		}
	}, [pathname, searchParams]);

	return null;
}

export default function MetaPixel() {
	return (
		<>
			<Script id="meta-pixel" strategy="afterInteractive">
				{`
					!function(f,b,e,v,n,t,s)
					{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
					n.callMethod.apply(n,arguments):n.queue.push(arguments)};
					if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
					n.queue=[];t=b.createElement(e);t.async=!0;
					t.src=v;s=b.getElementsByTagName(e)[0];
					s.parentNode.insertBefore(t,s)}(window, document,'script',
					'https://connect.facebook.net/en_US/fbevents.js');
					fbq('init', '${FB_PIXEL_ID}');
				`}
			</Script>
			<Suspense fallback={null}>
				<MetaPixelTracker />
			</Suspense>
			<noscript>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					height="1"
					width="1"
					style={{ display: "none" }}
					src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
					alt=""
				/>
			</noscript>
		</>
	);
}
