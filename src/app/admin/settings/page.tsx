import { requireAdmin, hasOwnPassword, MIN_PASSWORD_LENGTH } from "@/lib/admin-auth";
import { changePasswordAction } from "./password-actions";
import { getSettings, getPriceListPdfMeta } from "@/lib/catalog";
import { emailConfigured, ownerEmail } from "@/lib/email";
import { areaKey, EMAIL_TEMPLATE_TOKENS, EMAIL_TEMPLATE_DEFAULTS } from "@/lib/site";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/db";
import EmailTemplateRow from "./EmailTemplateRow";
import {
	saveSettingsAction,
	sendTestEmailAction,
	importDeliveryFileAction,
	uploadPriceListPdfAction,
	deletePriceListPdfAction,
} from "./actions";
import ImageInput from "./ImageInput";
import AreaRows from "./AreaRows";
import { SaveButton } from "@/app/admin/SaveButton";
import DeliveryAreaImporter from "./DeliveryAreaImporter";
import { aCard, aCardTitle, aCardSub, aLabel, aHint, aInput, aBtn, aBtnGhost, aPageTitle, aSuccess } from "@/lib/admin-ui";

export const dynamic = "force-dynamic";

export default async function AdminSettings({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; test?: string; pw?: string; import?: string; pdf?: string; error?: string }>;
}) {
	await requireAdmin();
	const [s, priceListPdf] = await Promise.all([getSettings(), getPriceListPdfMeta()]);
	const mail = emailConfigured();
	const inbox = ownerEmail();
	const { saved, test, pw, import: imported, pdf: pdfMsg, error } = await searchParams;
	const ownPassword = await hasOwnPassword();

	return (
		<div>
			<h1 className={aPageTitle}>Settings</h1>
			<p className="mb-6 mt-1 text-[15px] text-muted">
				Everything here shows on your website. Change anything, then press{" "}
				<b>Save changes</b> at the bottom — it goes live straight away.
			</p>

			{saved && <p className={aSuccess}>✓ Saved! Your website is updated.</p>}
			{error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] font-medium text-red-700">✕ {error}</p>}

			{/* ---- Password (own form — nothing to do with Save changes below) ---- */}
			<div id="password" className={`mb-6 ${aCard}`}>
				<h2 className={aCardTitle}>🔒 Your password</h2>
				<p className={aCardSub}>
					The password you type to get into this admin panel. Change it any time.
				</p>

				{pw === "ok" && <p className={aSuccess}>✓ Password changed. Use the new one from now on.</p>}
				{pw && pw !== "ok" && (
					<p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[14.5px] font-medium text-red-700">
						{pw === "wrong_current" && "That current password isn't right. Try again."}
						{pw === "too_short" && `Your new password needs at least ${MIN_PASSWORD_LENGTH} letters or numbers.`}
						{pw === "mismatch" && "The two new passwords don't match."}
						{pw === "same_as_current" && "That's the same as your current password — pick a different one."}
					</p>
				)}

				{!ownPassword && (
					<p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14.5px] text-amber-800">
						You&apos;re still using the password your developer set up. Change it to something
						only you know.
					</p>
				)}

				<form action={changePasswordAction} className="grid gap-4 sm:grid-cols-2">
					<label className="block sm:col-span-2">
						<span className={aLabel}>Current password</span>
						<input type="password" name="currentPassword" autoComplete="current-password" className={aInput} />
					</label>
					<label className="block">
						<span className={aLabel}>New password</span>
						<input type="password" name="newPassword" autoComplete="new-password" className={aInput} />
						<span className={aHint}>At least {MIN_PASSWORD_LENGTH} letters or numbers.</span>
					</label>
					<label className="block">
						<span className={aLabel}>Type the new password again</span>
						<input type="password" name="confirmPassword" autoComplete="new-password" className={aInput} />
					</label>
					<div className="sm:col-span-2">
						<button className={aBtn}>Change my password</button>
						<p className={aHint}>
							Changing it signs you out on every other phone and computer — that&apos;s on purpose.
						</p>
					</div>
				</form>
			</div>

			{/* ---- Automatic emails (Resend) ---- */}
			<div className={`mb-6 ${aCard}`}>
				<h2 className={aCardTitle}>✉️ Automatic emails</h2>
				<p className={aCardSub}>
					When this is on, you get an email for every new order, and customers get an
					email when you update their order.
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<span className={`h-3 w-3 rounded-full ${mail ? "bg-emerald-500" : "bg-gray-300"}`} />
					<span className="text-[15px] font-bold text-ink">{mail ? "On" : "Off"}</span>
					<span className="text-[14px] text-muted">
						{mail
							? `— alerts go to ${inbox}.`
							: "— not set up yet. Ask your developer to switch it on (needs a Resend key)."}
					</span>
				</div>

				{test === "ok" && (
					<p className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-[14px] text-emerald-800">
						✓ Test email sent to {inbox}. Check that inbox (and spam) — if it arrived, emails work.
					</p>
				)}
				{test === "fail" && (
					<p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[14px] text-red-700">
						✕ Couldn&apos;t send. The email setup needs attention — tell your developer.
					</p>
				)}
				{test === "unconfigured" && (
					<p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[14px] text-amber-800">
						Emails aren&apos;t switched on yet.
					</p>
				)}

				<form action={sendTestEmailAction} className="mt-3">
					<button className={aBtnGhost}>Send a test email</button>
				</form>
			</div>

			{/* ---- Bulk import delivery areas ----
			    Deliberately OUTSIDE the big Save-changes form below. */}
			<div id="delivery" className={`mb-6 ${aCard}`}>
				<h2 className={aCardTitle}>📥 Bulk import delivery areas (Excel/CSV)</h2>
				<p className={aCardSub}>
					Upload any delivery spreadsheet (Excel <b className="text-ink-soft">.xlsx / .xls</b> or <b className="text-ink-soft">.csv</b>).
					Columns for State, City, Area/Address, Google Map Link, and Delivery Fee are automatically detected in any column order,
					and extra columns are ignored. If any column cannot be recognized, a simple mapping step will let you choose which column matches.
					Importing only <b className="text-ink-soft">adds and updates</b> delivery areas — it never deletes areas you previously entered.
				</p>

				<DeliveryAreaImporter initialImportMsg={imported} />
			</div>

			{/* ---- Price list PDF (own form — outside the big Save-changes form below) ---- */}
			<div id="price-list-pdf" className={`mb-6 ${aCard}`}>
				<h2 className={aCardTitle}>📄 Price list PDF</h2>
				<p className={aCardSub}>
					The <b className="text-ink-soft">Price List</b> button at the top of every page
					downloads this file straight away — no page to click through. Upload the real price
					list here whenever it changes; the button always serves the latest one. Until you
					upload one, that button just goes to the price page instead.
				</p>

				{pdfMsg === "empty" && (
					<p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-700">
						Choose a PDF file first.
					</p>
				)}
				{pdfMsg === "badfile" && (
					<p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-700">
						That doesn&apos;t look like a real PDF — please upload a .pdf file.
					</p>
				)}
				{pdfMsg === "toobig" && (
					<p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-700">
						That file is too large — keep it under 1.4 MB. A plain price list (no scanned
						photos) is normally well under 200 KB; export it from Word/Excel again if it&apos;s
						bigger.
					</p>
				)}
				{pdfMsg === "uploaded" && (
					<p className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13.5px] text-emerald-800">
						✓ Uploaded — the Price List button now downloads this file.
					</p>
				)}
				{pdfMsg === "deleted" && (
					<p className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13.5px] text-emerald-800">
						✓ Removed — the Price List button goes to the price page until you upload another.
					</p>
				)}

				{priceListPdf ? (
					<div className="mb-3 flex flex-wrap items-center gap-2">
						<a
							href={priceListPdf.url}
							className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] font-semibold text-ink hover:bg-row"
						>
							⬇️ Current file: {priceListPdf.filename}
						</a>
						<form action={deletePriceListPdfAction}>
							<button className="rounded-lg border border-red-300 px-3 py-2 text-[14px] font-semibold text-red-600 hover:bg-red-50">
								Delete
							</button>
						</form>
					</div>
				) : (
					<p className="mb-3 text-[13.5px] text-muted">No PDF uploaded yet.</p>
				)}

				<form
					action={uploadPriceListPdfAction}
					className="flex flex-wrap items-center gap-2"
				>
					<input
						type="file"
						name="priceListPdf"
						accept=".pdf,application/pdf"
						required
						className="text-[14px] text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-[14px] file:font-semibold file:text-white hover:file:brightness-110"
					/>
					<button className="rounded-lg bg-brand px-4 py-2.5 text-[14px] font-semibold text-white hover:brightness-110">
						{priceListPdf ? "Replace PDF" : "Upload PDF"}
					</button>
				</form>
			</div>

			<form action={saveSettingsAction} className="space-y-6">
				<Card icon="💰" title="Payment details" sub="How customers pay you after you confirm their order.">
					<Field name="upi" label="Your UPI ID" def={s.upi} hint="Customers pay here on Google Pay / PhonePe / Paytm. When set, checkout dynamically generates custom QR codes with each customer's exact order total pre-filled." />
					<div className="sm:col-span-2">
						<ImageInput name="upiQr" label="UPI QR code photo" defaultValue={s.upiQr} />
						<p className={aHint}>Static shop standee photo (shown in footer). Note: Checkout automatically generates a dynamic QR code with the customer's exact order total pre-filled.</p>
					</div>
					<Field name="bankHolder" label="Bank account holder name" def={s.bankHolder} />
					<Field name="bankName" label="Bank name" def={s.bankName} />
					<Field name="bankBranch" label="Branch" def={s.bankBranch} />
					<Field name="bankAccount" label="Account number" def={s.bankAccount} />
					<Field name="bankIfsc" label="IFSC code" def={s.bankIfsc} hint="The 11-character code in your passbook / cheque book." />
				</Card>

				<Card icon="📞" title="Contact details" sub="Shown in the header, footer and contact page.">
					<Field name="phone" label="Phone number" def={s.phone} hint="Customers call this. Also your Google Pay number." />
					<Field name="whatsapp" label="WhatsApp number" def={s.whatsapp} hint="Digits only with country code, e.g. 919344170018." />
					<Field name="email" label="Email address" def={s.email} />
				</Card>

				<section className={aCard}>
					<h2 className={aCardTitle}>✍️ Customer email wording</h2>
					<p className={aCardSub}>
						Write the subject and message a customer gets when you change their order&apos;s
						status — in your own words. Leave either box empty to keep sending the
						ready-made one shown greyed-out inside it. Each has a live example underneath
						so you can read exactly what the customer would see. The greeting
						(&ldquo;Hi [name],&rdquo;) and your shop&apos;s sign-off are added automatically
						to the message.
					</p>
					<p className="mb-4 rounded-lg border border-line bg-row px-3 py-2.5 text-[13.5px] text-ink-soft">
						You can use these anywhere in a subject or message and they&apos;ll be swapped
						for the real value:{" "}
						{EMAIL_TEMPLATE_TOKENS.map((t, i) => (
							<span key={t.token}>
								<code className="rounded bg-white px-1.5 py-0.5 font-mono text-[13px] text-brand">
									{t.token}
								</code>{" "}
								<span className="text-muted">({t.meaning})</span>
								{i < EMAIL_TEMPLATE_TOKENS.length - 1 ? " · " : ""}
							</span>
						))}
					</p>
					<div className="grid gap-3 sm:grid-cols-2">
						{ORDER_STATUSES.map((st) => {
							const def = EMAIL_TEMPLATE_DEFAULTS[st];
							const cur = s.emailTemplates[st];
							return (
								<EmailTemplateRow
									key={st}
									status={st}
									label={STATUS_LABEL[st]}
									defaultSubject={def?.subject ?? ""}
									defaultBody={def?.body ?? ""}
									initialSubject={cur?.subject ?? ""}
									initialBody={cur?.body ?? ""}
								/>
							);
						})}
					</div>
				</section>

				<Card icon="💵" title="Prices & delivery" sub="The basic rules for orders.">
					<Field name="minOrder" label="Smallest order you accept (₹)" def={String(s.minOrder)} type="number" hint="Customers can't order for less than this." />
					<Field name="discountPct" label="Main discount shown on the site (%)" def={String(s.discountPct)} type="number" hint="The big number customers see, e.g. 50." />
					<Field name="gstPct" label="GST tax %" def={String(s.gstPct)} type="number" hint="Leave 0 if you don't add GST to your bills." />
					<label className="flex items-start gap-2.5 text-[15px] text-ink sm:col-span-2">
						<input type="checkbox" name="requireUtr" defaultChecked={s.requireUtr} className="mt-1 h-5 w-5 accent-[var(--color-brand)]" />
						<span>
							Ask customers for their payment reference number
							<span className="mt-0.5 block text-[13.5px] text-muted">
								The UTR / transaction number from their payment — makes it easy to match who paid.
							</span>
						</span>
					</label>
					<div className="sm:col-span-2">
						<label className={aLabel}>States you deliver to</label>
						<textarea
							name="serviceStates"
							defaultValue={s.serviceStates.join(", ")}
							rows={2}
							className={aInput}
						/>
						<p className={aHint}>Separate each state with a comma. Add or remove one, press Save, then set its delivery charge below.</p>
					</div>
				</Card>

				<Card icon="🚚" title="Delivery charge, cities & areas" sub="State → city → area. Set what you charge, where you deliver, and the map pin for each area.">
					<div className="space-y-3 sm:col-span-2">
						<p className="text-[14px] text-muted">
							The delivery charge is added automatically at checkout. Customers can only pick
							a city — and an area inside it — that you list here, so they can&apos;t order to a
							place you don&apos;t serve.
						</p>
						<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13.5px] text-amber-800">
							New city? Type it in the city box, press <b>Save changes</b>, then come back — its
							area boxes will appear underneath.
						</p>
						<p className="text-[13.5px] text-muted">
							Got a lot of areas to add at once? Use <b>📥 Bulk import from Excel</b> near the top
							of this page instead of typing them all in below.
						</p>
						{s.serviceStates.map((st) => (
							<div key={st} className="rounded-xl border border-line bg-row p-3.5">
								<div className="mb-2 flex flex-wrap items-center justify-between gap-3">
									<span className="text-[16px] font-bold text-ink">{st}</span>
									<label className="flex items-center gap-2 text-[14px] font-semibold text-ink">
										Delivery ₹
										<input
											name={`fee::${st}`}
											type="number"
											min={0}
											defaultValue={s.transportFees[st] ?? 0}
											className="w-28 rounded-lg border border-line bg-white px-3 py-2 text-[16px] text-ink outline-none focus:border-brand"
										/>
									</label>
								</div>
								<label className="block text-[14px] text-ink-soft">
									Cities you deliver to (separate with commas)
									<textarea
										name={`cities::${st}`}
										defaultValue={(s.serviceCities[st] ?? []).join(", ")}
										rows={2}
										className={aInput}
									/>
								</label>

								{/* Level 3 — areas inside each city, each with its own Google Maps pin. */}
								<div className="mt-3 space-y-2">
									{(s.serviceCities[st] ?? []).map((city) => {
										const areas = s.serviceAreas[areaKey(st, city)] ?? [];
										return (
											<details key={city} className="rounded-lg border border-line bg-white px-3 py-2">
												<summary className="cursor-pointer list-none text-[14.5px] font-semibold text-ink">
													📍 {city}
													<span className="ml-2 text-[13px] font-normal text-muted">
														{areas.length
															? `${areas.length} area${areas.length > 1 ? "s" : ""} — click to edit`
															: "no areas yet — click to add"}
													</span>
												</summary>
												<p className={aHint}>
													Areas inside {city} the customer picks from. Paste the Google Maps
													link of each delivery point — the customer sees it at checkout and
													gets it by email. Press <b>+ Add another area</b> for as many as you
													need; <b>✕</b> removes one.
												</p>
												<AreaRows base={`area::${areaKey(st, city)}`} areas={areas} />
												<p className="mt-2 text-[13px] text-muted">
													To get a link: open Google Maps → search the spot → <b>Share</b> →{" "}
													<b>Copy link</b> → paste it here.
												</p>
											</details>
										);
									})}
									{(s.serviceCities[st] ?? []).length === 0 && (
										<p className="text-[13.5px] text-muted">Add a city above and press Save to set its areas.</p>
									)}
								</div>
							</div>
						))}
					</div>
				</Card>

				<Card icon="🏪" title="Your shop details" sub="Name, hours and address shown around the site.">
					<Field name="tagline" label="Short slogan" def={s.tagline} hint="One line under your shop name." />
					<Field name="hours" label="Opening hours" def={s.hours} />
					<Field name="addressLine" label="Address" def={s.addressLine} />
					<Field name="legalName" label="Registered / firm name" def={s.legalName} hint="Shown small in the footer." />
					<Field name="gstNumber" label="GST number" def={s.gstNumber} hint="Leave blank to hide it." />
					<Field name="licence" label="Explosives licence number" def={s.licence} hint="Leave blank to hide it." />
					<div className="sm:col-span-2">
						<Field name="stockistOf" label="Brand name to display" def={s.stockistOf} hint="Only if you're allowed to use it in writing. Leave blank to hide." />
					</div>
				</Card>

				<Card icon="🏷️" title="Buy more, save more offers" sub="Extra discount when a customer spends more. Leave a row blank to remove it.">
					<div className="space-y-2 sm:col-span-2">
						{[0, 1, 2, 3].map((i) => {
							const t = s.discountTiers[i];
							return (
								<div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-row p-3 sm:grid-cols-[1fr_1fr_2fr]">
									<label className="text-[14px] font-semibold text-ink-soft">
										When they spend at least ₹
										<input
											name={`tierMin::${i}`}
											type="number"
											min={0}
											defaultValue={t?.min ?? ""}
											className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[16px] text-ink outline-none focus:border-brand"
										/>
									</label>
									<label className="text-[14px] font-semibold text-ink-soft">
										Give extra % off
										<input
											name={`tierExtra::${i}`}
											type="number"
											min={0}
											defaultValue={t?.extra ?? ""}
											className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[16px] text-ink outline-none focus:border-brand"
										/>
									</label>
									<label className="text-[14px] font-semibold text-ink-soft">
										Label (leave blank for auto)
										<input
											name={`tierLabel::${i}`}
											defaultValue={t?.label ?? ""}
											className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[16px] text-ink outline-none focus:border-brand"
										/>
									</label>
								</div>
							);
						})}
					</div>
				</Card>

				<Card icon="📣" title="Announcement banner" sub="The scrolling message under the top banner on the home page.">
					<div className="sm:col-span-2">
						<Field name="announcement" label="Announcement message" def={s.announcement} hint="e.g. your current offer or season." />
					</div>
					<Field name="festivalName" label="Festival name for the countdown" def={s.festivalName} hint="Shown as '...to Deepavali'. Leave blank to hide the countdown entirely." />
					<Field
						name="festivalDate"
						label="Festival date"
						def={s.festivalDate}
						type="date"
						hint="The countdown in the scrolling banner ticks down to this date, live. Update it every season — festival dates move every year."
					/>
				</Card>

				<Card icon="🔗" title="Social media links" sub="Leave blank to hide that icon.">
					<Field name="instagram" label="Instagram link" def={s.instagram} />
					<Field name="facebook" label="Facebook link" def={s.facebook} />
					<Field name="youtube" label="YouTube link" def={s.youtube} />
				</Card>

				<Card icon="📖" title="About your shop" sub="The story shown on the About page.">
					<div className="sm:col-span-2">
						<label className={aLabel}>Your story</label>
						<textarea name="aboutStory" defaultValue={s.aboutStory} rows={8} className={aInput} />
						<p className={aHint}>Leave one empty line between paragraphs.</p>
					</div>
				</Card>

				<Card icon="🖼️" title="Shop logo & pictures" sub="Your logo, shop photos and home-page banners now live in their own tab.">
					<div className="sm:col-span-2">
						<a href="/admin/photos" className={aBtnGhost}>
							Go to the Photos tab →
						</a>
						{/* Keeps a logo saved the old way (inside settings) from being wiped on Save. */}
						<input type="hidden" name="logo" value={s.logo} />
					</div>
				</Card>

				{/* Advanced — techy stuff most owners never touch */}
				<details className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
					<summary className="cursor-pointer list-none text-[16px] font-bold text-ink-soft">
						⚙️ Advanced (optional) — how you appear on Google
						<span className="ml-2 text-[13px] font-normal text-muted">click to open</span>
					</summary>
					<div className="mt-4 grid gap-3 sm:grid-cols-2">
						<Field name="metaTitle" label="Google search title" def={s.metaTitle} />
						<Field name="gaId" label="Google Analytics 4 Measurement ID" def={s.gaId} hint="Format: G-XXXXXXXXXX (optional, tracks visitors in Google Analytics)" />
						<div className="sm:col-span-2">
							<label className={aLabel}>Google search description</label>
							<textarea name="metaDescription" defaultValue={s.metaDescription} rows={2} className={aInput} />
						</div>
					</div>
				</details>

				<div className="sticky bottom-4 z-10 flex flex-col items-center justify-center pt-2">
					<SaveButton
						label="✓ Save changes"
						pendingLabel="Saving..."
						savedLabel="Saved ✓"
						saved={Boolean(saved)}
						error={error}
						className={aBtn}
					/>
				</div>
			</form>
		</div>
	);
}

function Card({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children: React.ReactNode }) {
	return (
		<section className={aCard}>
			<h2 className={aCardTitle}>
				<span aria-hidden>{icon}</span> {title}
			</h2>
			{sub && <p className={aCardSub}>{sub}</p>}
			<div className="grid gap-4 sm:grid-cols-2">{children}</div>
		</section>
	);
}

function Field({
	name,
	label,
	def,
	type = "text",
	hint,
}: {
	name: string;
	label: string;
	def: string;
	type?: string;
	hint?: string;
}) {
	return (
		<label className="block">
			<span className={aLabel}>{label}</span>
			<input name={name} type={type} defaultValue={def} className={aInput} />
			{hint && <span className={aHint}>{hint}</span>}
		</label>
	);
}
