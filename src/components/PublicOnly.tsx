"use client";

import { usePathname } from "next/navigation";

/** Renders children on the public site, but not inside the /admin area. */
export default function PublicOnly({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	if (pathname?.startsWith("/admin")) return null;
	return <>{children}</>;
}
