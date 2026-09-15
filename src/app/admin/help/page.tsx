import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { emailConfigured, ownerEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function AdminHelp() {
	await requireAdmin();
	const mail = emailConfigured();
	const inbox = ownerEmail();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-[26px] font-extrabold text-ink">Help &amp; how-to</h1>
				<p className="mt-1 text-[15px] text-muted">
					Everything you can change yourself from this panel — no developer needed. Changes
					go live on the website within a few seconds of saving.
				</p>
			</div>

			<Card title="🧭 The tabs — what each one does">
				<Row k="Dashboard" v="A quick summary — new orders waiting, recent activity." />
				<Row
					k="Orders"
					v="Every enquiry/order customers place. Open one to see their list, mark payment verified, and move it through packing → dispatched → delivered. The customer gets an email at each step (if email is set up)."
				/>
				<Row
					k="Products"
					v="Your full price list. Add, rename, hide, or delete items and — most importantly — set the real prices."
				/>
				<Row
					k="Codes"
					v="Discount codes you give a customer while bargaining on the phone. Easiest way: open their order and press 'Give this customer a coupon' — it makes the code, locks it to their phone number, and writes the WhatsApp message for you. They type it at checkout and the money comes off by itself."
				/>
				<Row
					k="Photos"
					v="Your own pictures: the shop logo, shop/godown photos for the About page, and wide banners for the home page."
				/>
				<Row
					k="Settings"
					v="All the text, numbers, contact details, discounts, delivery areas and payment details shown across the website."
				/>
			</Card>

			<Card title="📷 Adding your own photos">
				<p>
					Anywhere you see a dotted box with <b>+ Add photo</b>, click it and pick a picture
					from your phone or computer. It saves and appears on the website by itself —
					there is nothing else to press.
				</p>
				<Row
					k="Product photos"
					v="Products tab — the box on the left of each item. A product with no photo shows its category picture instead."
				/>
				<Row
					k="Category photos"
					v="Products tab → Manage categories. Used on the home page and at the top of that category in the price list."
				/>
				<Row
					k="Logo, shop photos, banners"
					v="Photos tab."
				/>
				<Row
					k="UPI QR code"
					v="Settings tab → Payment."
				/>
				<p className="text-muted">
					Big photos are fine — a picture straight from your phone gets shrunk automatically
					before it is saved. Please use <b>your own</b> photos: pictures taken from other
					shops&apos; or brands&apos; websites belong to them.
				</p>
			</Card>

			<Card title="💰 Changing prices (do this first)">
				<p>
					Go to <Tab href="/admin/products">Products</Tab>. Every item has a{" "}
					<b>List price</b> (the printed rate) and <b>Your price</b> (what the customer
					actually pays). Type the numbers and save.
				</p>
				<p className="text-muted">
					Any item you haven&apos;t priced yet shows a <b>“—”</b> on the site (never a
					fake number). The moment you save a real price, it appears instantly for that
					item.
				</p>
				<p>
					You can also hide an item (out of stock) instead of deleting it, and add brand-new
					items or categories.
				</p>
			</Card>

			<Card title="⚙️ What you can change in Settings">
				<Row k="Discount %" v="The big “FLAT __% OFF” headline shown across the site." />
				<Row k="Buy more · save more slabs" v="Spend ₹X → extra % off. Set up to 4, shown on the home hero." />
				<Row k="Minimum order" v="The smallest order you'll accept (shown everywhere)." />
				<Row k="Contact" v="Phone, WhatsApp number, email — updates the header, footer and contact page at once." />
				<Row k="Payment" v="UPI ID, upload a UPI QR image, and bank account details for the footer." />
				<Row k="Delivery" v="Three levels: the states you serve (with a transport fee each) → the cities in each state → the areas inside each city, with a Google Maps link for every area. Customers can only order to a place you list, and they see the map pin of the area they pick." />
				<Row k="Your password" v="Change the password you use to log in here. Do this once so only you know it. If you ever forget it, use 'Forgotten your password?' on the login screen — or call your developer, who can always let you back in." />
				<Row k="GST" v="Set a GST % to add it at checkout, and your GSTIN to show it in the footer." />
				<Row k="Business identity" v="Tagline, opening hours, address, firm name, explosives licence no." />
				<Row k="Social links" v="Instagram / Facebook / YouTube — leave blank to hide." />
				<Row k="About-page story" v="Your shop's story text — write it in your own words." />
				<Row k="SEO" v="The title and description that show up on Google. (The logo moved to the Photos tab.)" />
			</Card>

			<Card title="📧 Email notifications">
				<div className="flex flex-wrap items-center gap-2">
					<span className={`h-3 w-3 rounded-full ${mail ? "bg-emerald-500" : "bg-gray-300"}`} />
					<span className="font-bold text-ink">{mail ? "On" : "Not on yet"}</span>
					<span className="text-muted">
						{mail ? `— alerts go to ${inbox}.` : "— see the setup steps below."}
					</span>
				</div>
				<p>
					When connected, you get an email the moment a new order or payment comes in, and
					the customer automatically gets an email each time you change their order status.
					Until it's set up, you can still email a customer with the{" "}
					<b>“Email customer”</b> button on each order (it opens your own mail app).
				</p>
				<p className="text-muted">
					Turning it on is a one-time developer step (adding a couple of secret keys and
					verifying your email domain). Use the{" "}
					<Tab href="/admin/settings">Settings</Tab> page's “Send test email” button to
					confirm it works. If a test doesn't arrive, check the domain is verified.
				</p>
			</Card>

			<Card title="⚖️ Important — please don't change these (they're the law)">
				<p>
					This site does <b>not</b> sell crackers online or take online payment, does{" "}
					<b>not</b> offer courier-to-door delivery, and does <b>not</b> serve Delhi-NCR.
					These aren't design choices — they're legal requirements for firecracker sales in
					India (Supreme Court orders + Explosives Rules). Please keep them as-is.
				</p>
				<p className="text-muted">
					The rules are re-issued each year around Deepavali — a quick check with us every
					September/October keeps everything current.
				</p>
			</Card>

			<Card title="🆘 Stuck?">
				<p>
					If something doesn't look right after saving, refresh the website page. For
					anything you can't change here, contact Fresh Frame — we build, you grow.
				</p>
			</Card>
		</div>
	);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
			<h2 className="mb-3 text-[17px] font-bold text-brand">{title}</h2>
			<div className="space-y-2.5 text-[15px] leading-7 text-ink-soft">{children}</div>
		</section>
	);
}

function Row({ k, v }: { k: string; v: string }) {
	return (
		<div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]">
			<span className="font-bold text-ink">{k}</span>
			<span className="text-ink-soft">{v}</span>
		</div>
	);
}

function Tab({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<Link href={href} className="font-semibold text-brand underline">
			{children}
		</Link>
	);
}
