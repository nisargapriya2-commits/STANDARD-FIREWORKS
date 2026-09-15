import type { Metadata } from "next";
import Link from "next/link";
import { isAuthed, destroySession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { SITE } from "@/lib/site";
import { BrandMark } from "@/components/icons";

export const metadata: Metadata = {
	title: "Admin",
	robots: { index: false, follow: false },
};

async function logout() {
	"use server";
	await destroySession();
	redirect("/admin/login");
}

const NAV = [
	{ href: "/admin", label: "Home", icon: "🏠" },
	{ href: "/admin/orders", label: "Orders", icon: "📦" },
	{ href: "/admin/products", label: "Products", icon: "🏷️" },
	{ href: "/admin/price-list", label: "Price List", icon: "📄" },
	{ href: "/admin/coupons", label: "Codes", icon: "🎟️" },
	{ href: "/admin/photos", label: "Photos", icon: "🖼️" },
	{ href: "/admin/settings", label: "Settings", icon: "⚙️" },
	{ href: "/admin/help", label: "Help", icon: "❓" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const authed = await isAuthed();
	return (
		<div className="min-h-screen bg-[#faf6ef] text-ink">
			<header className="print:hidden border-b border-line bg-white shadow-sm">
				<div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-3">
					<Link href="/admin" className="flex items-center gap-2.5 text-[17px] font-extrabold text-ink">
						<span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
							<BrandMark className="h-6 w-6" />
						</span>
						{SITE.name} · Admin
					</Link>
					{authed && (
						<nav className="flex flex-wrap items-center gap-1 text-[15px] font-semibold">
							{NAV.map((n) => (
								<Link
									key={n.href}
									href={n.href}
									className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-ink-soft hover:bg-row hover:text-brand"
								>
									<span aria-hidden>{n.icon}</span>
									{n.label}
								</Link>
							))}
							<form action={logout}>
								<button className="ml-1 rounded-lg border border-line px-3 py-2 text-ink-soft hover:bg-row">
									Log out
								</button>
							</form>
						</nav>
					)}
				</div>
			</header>
			<main className="mx-auto max-w-[1100px] px-4 py-8 print:max-w-none print:p-0">{children}</main>
		</div>
	);
}
