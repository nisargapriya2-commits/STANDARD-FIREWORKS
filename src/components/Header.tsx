"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { type PublicSite, telLinkTo } from "@/lib/site";
import { PhoneIcon, MailIcon, SparkBurst } from "@/components/icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About Us" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header({ site }: { site: PublicSite }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    // NOTE: <header> deliberately does NOT wrap the <nav> below.
    // position:sticky is confined to its parent's box, so a sticky nav inside
    // this header would scroll away with it. Keeping them siblings makes the
    // nav's containing block the page, so it sticks for real.
    <>
      <header>
      {/* ---- utility bar ---- */}
      <div className="top-bar text-white/90 text-[14px]">
        <div className="mx-auto flex max-w-292.5 flex-wrap items-center justify-between gap-2 px-4 py-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <a href={telLinkTo(site.phone)} className="inline-flex items-center gap-1.5 hover:text-yellow">
              <PhoneIcon className="h-3.5 w-3.5" /> {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="hidden items-center gap-1.5 hover:text-yellow sm:inline-flex"
            >
              <MailIcon className="h-3.5 w-3.5" /> {site.email}
            </a>
            <span className="hidden font-medium tracking-wide opacity-80 md:inline">
              {site.shortName}
            </span>
          </div>
          <span className="hidden items-center gap-1.5 text-[13.5px] text-yellow/90 sm:inline-flex">
            <SparkBurst className="h-3.5 w-3.5" /> Booking open · Deepavali 2026
          </span>
        </div>
      </div>

      {/* ---- brand bar ---- */}
      <div className="brand-bar">
        <div className="relative mx-auto flex max-w-292.5 items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            {/* Real Standard Fireworks wordmark — floated on a soft gold halo
                (no white box; the old chip looked cheap). */}
            <span className="logo-halo logo-halo--sm flex-none">
              {site.logo ? (
                // Owner-uploaded logo (admin → Photos). Plain <img>: the source is a
                // D1-backed URL, not a build-time asset, so next/image can't size it.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logo} alt={site.name} className="h-9 w-auto sm:h-10" />
              ) : (
                <Image
                  src="/brand-logo.png"
                  alt="Standard Fireworks"
                  width={411}
                  height={108}
                  priority
                  className="h-9 w-auto sm:h-10"
                />
              )}
            </span>
            <span className="leading-tight">
              <span className="block text-[14px] font-semibold tracking-[0.25em] text-yellow">
                SIVAKASI · CHENNAI
              </span>
              <span className="block text-[12px] tracking-wide text-white/85">
                Wholesale/retail crackers, delivered
              </span>
            </span>
          </Link>
        </div>
      </div>

      </header>

      {/* ---- nav ----
          h-11 (44px) is fixed on purpose at every breakpoint: the sticky totals
          bar on /products offsets against it, and a nav that changes height
          between desktop and mobile silently buries that bar. */}
      <nav className="nav-bar sticky top-0 z-50 shadow-sm">
        <div className="mx-auto flex h-11 max-w-292.5 items-center justify-between px-4">
          {/* left: links (desktop) / hamburger (mobile) */}
          <ul className="hidden h-full md:flex">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={`flex h-full items-center px-4 text-[16px] font-medium transition-colors ${
                      active
                        ? "bg-white/6 text-gold shadow-[inset_0_-3px_0_var(--color-yellow)]"
                        : "text-white/80 hover:bg-white/10 hover:text-gold"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className="px-2 text-2xl leading-none text-white md:hidden"
          >
            {open ? "×" : "☰"}
          </button>

          {/* right: sticky actions — travel with the header on scroll */}
          <div className="flex items-center gap-2">
            <Link
              href="/price-list"
              className={`hidden rounded-md border border-yellow/70 px-3 py-1.5 text-[14px] font-semibold transition-colors hover:bg-yellow/15 sm:inline-flex ${
                pathname === "/price-list" ? "bg-yellow/20 text-yellow shadow-inner" : "text-gold"
              }`}
            >
              Price List
            </Link>
            {/*
              "Order Now" goes to the online ordering/products page, keeping ordering
              and PDF price list viewing completely separate.
            */}
            <Link href="/products" className="btn-yellow shimmer px-3! py-1.5! text-[13.5px]!">
              <SparkBurst className="h-3.5 w-3.5" /> Order Now
            </Link>
          </div>
        </div>

        {open && (
          <ul className="nav-bar absolute inset-x-0 top-11 border-t border-yellow/25 shadow-lg md:hidden">
            {[
              { href: "/", label: "Home" },
              { href: "/price-list", label: "📄 Price List (PDF)" },
              { href: "/products", label: "🛒 Order Now / Products" },
              { href: "/about", label: "About Us" },
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact Us" },
            ].map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-white/5 px-4 py-3 text-sm ${
                    pathname === n.href
                      ? "bg-white/6 font-semibold text-gold shadow-[inset_3px_0_0_var(--color-yellow)]"
                      : "text-white/85"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </>
  );
}
