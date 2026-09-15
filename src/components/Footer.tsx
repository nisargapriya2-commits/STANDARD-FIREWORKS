import Link from "next/link";
import { type PublicSite, money, telLinkTo } from "@/lib/site";
import { PhoneIcon, MailIcon, PinIcon } from "@/components/icons";

export default function Footer({ site }: { site: PublicSite }) {
  const socials = [
    ["Instagram", site.instagram],
    ["Facebook", site.facebook],
    ["YouTube", site.youtube],
  ].filter(([, url]) => url) as [string, string][];
  return (
    <footer>
      {/* ---- payment / bank band ---- */}
      <div className="bg-brand-dark text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h3 className="mb-5 border-b border-white/25 pb-2 text-lg font-semibold">
            Bank Details For Payment
          </h3>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="text-[16px] leading-7 text-white/90">
              <p>{site.bank.holder}</p>
              <p>{site.bank.name}</p>
              <p>{site.bank.branch}</p>
              <p>A/c: {site.bank.account}</p>
              <p>IFSC: {site.bank.ifsc}</p>
            </div>
            <div>
              <p className="mb-2 text-[16px] font-semibold">Pay Online</p>
              {site.upiQr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.upiQr}
                  alt="UPI QR code"
                  className="h-32 w-32 rounded border border-white/25 bg-white object-contain p-1"
                />
              ) : (
                <div className="grid h-32 w-32 place-items-center border border-white/25 bg-white/10 text-center text-[13px] leading-4 text-white/70">
                  {site.upi && site.upi !== "example@upi" ? (
                    <span>
                      UPI
                      <br />
                      {site.upi}
                    </span>
                  ) : (
                    <span className="px-2">Ask for our UPI on the call</span>
                  )}
                </div>
              )}
              <p className="mt-2 text-[15px] text-white/85">
                Google Pay / Paytm / PhonePe: {site.phone}
              </p>
              <p className="mt-1 text-[14px] text-white/60">
                Cash on delivery is not available.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- mast-headed close (not a 4-column link farm) ---- */}
      <div className="bg-brand text-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            {/* left: name + one-line + call */}
            <div className="max-w-md">
              <p className="text-3xl font-bold tracking-tight">{site.name}</p>
              <p className="mt-3 text-[16px] leading-7 text-white/85">
                A Sivakasi family in the cracker trade. We buy wholesale here and sell
                direct — no showroom, no middlemen, no commission.
              </p>
              <a href={telLinkTo(site.phone)} className="btn-yellow mt-6">
                <PhoneIcon className="h-4 w-4" /> Call {site.phone}
              </a>
            </div>

            {/* right: contact + one inline row of links */}
            <div className="text-[16px]">
              <address className="space-y-2 not-italic leading-7 text-white/85">
                <p className="flex items-center gap-2">
                  <PinIcon className="h-5 w-5 flex-none text-yellow" /> {site.addressLine}
                </p>
                <p className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4 flex-none text-yellow" />
                  <a href={`mailto:${site.email}`} className="hover:text-yellow">
                    {site.email}
                  </a>
                </p>
                {site.gst && <p className="text-white/70">GSTIN: {site.gst}</p>}
                {site.licence && <p className="text-white/70">Licence: {site.licence}</p>}
              </address>
              <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/20 pt-4 text-[15px] font-medium">
                {[
                  ["/", "Home"],
                  ["/price-list", "Price list"],
                  ["/products", "Order Online"],
                  ["/about", "About"],
                  ["/faq", "FAQ"],
                  ["/contact", "Contact"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="text-white/90 hover:text-yellow">
                    {label}
                  </Link>
                ))}
              </nav>
              {socials.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[14.5px]">
                  {socials.map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-yellow hover:underline"
                    >
                      {label} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- legal ---- */}
      <div className="bg-[#1c1c1c] text-white/70">
        <div className="mx-auto max-w-7xl px-4 py-5 text-[14px] leading-5">
          <p className="mb-2">
            <strong className="text-white/90">Please note:</strong> Sale and use of
            firecrackers in India is regulated by orders of the Hon&apos;ble Supreme Court
            and by the Explosives Act, 1884 / Explosives Rules, 2008.{" "}
            <strong className="text-white/90">
              This website does not sell crackers online and does not accept online
              payment.
            </strong>{" "}
            The price list is for enquiry only — we confirm availability and the final
            estimate by phone, and payment is completed offline. Delivery is by goods
            transport to your nearest transport office; crackers cannot legally be sent by
            courier or post. We do not deliver to Delhi-NCR or to any state where sale is
            banned. Minimum order {money(site.minOrder)}.
          </p>
          <div className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-3">
            <span>
              © {new Date().getFullYear()} {site.name}
              {site.legalName ? ` (${site.legalName})` : ""}. All rights reserved.
            </span>
            <span>
              Site by{" "}
              <a
                href="https://freshframe.studio/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow hover:underline"
              >
                Fresh Frame
              </a>{" "}
              — we build, you grow.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
