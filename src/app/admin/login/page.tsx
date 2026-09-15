import { redirect } from "next/navigation";
import {
	verifyPassword,
	createSession,
	isAuthed,
	startPasswordReset,
	completePasswordReset,
	resetPending,
	MIN_PASSWORD_LENGTH,
} from "@/lib/admin-auth";
import { emailConfigured, ownerEmail, sendEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

async function login(formData: FormData) {
	"use server";
	const password = String(formData.get("password") || "");
	if (await verifyPassword(password)) {
		await createSession();
		redirect("/admin");
	}
	redirect("/admin/login?e=1");
}

/** Emails a one-time code to the shop's own inbox. */
async function requestReset() {
	"use server";
	if (!emailConfigured()) redirect("/admin/login?r=nomail");
	const code = await startPasswordReset();
	const to = ownerEmail();
	const ok = await sendEmail({
		to,
		subject: `${SITE.name} admin — your password reset code`,
		text:
			`Someone asked to reset the password for your ${SITE.name} admin panel.\n\n` +
			`Your code is: ${code}\n\n` +
			`Type it on the login page along with your new password. The code stops working in 20 minutes.\n\n` +
			`If this wasn't you, ignore this email — nothing has changed yet.`,
	});
	redirect(`/admin/login?r=${ok ? "sent" : "failed"}`);
}

async function submitReset(formData: FormData) {
	"use server";
	const err = await completePasswordReset(
		String(formData.get("code") || ""),
		String(formData.get("newPassword") || ""),
		String(formData.get("confirmPassword") || ""),
	);
	if (err) redirect(`/admin/login?r=${err}`);
	redirect("/admin");
}

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ e?: string; r?: string }>;
}) {
	if (await isAuthed()) redirect("/admin");
	const { e, r } = await searchParams;
	const pending = await resetPending();
	const mail = emailConfigured();

	return (
		<div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-white p-7 shadow-sm sm:p-8">
			<h1 className="mb-1 text-[26px] font-extrabold text-ink">Welcome back 👋</h1>
			<p className="mb-6 text-[15px] text-muted">Enter your password to manage your shop.</p>

			<form action={login} className="space-y-4">
				<div>
					<label className="mb-1 block text-[15px] font-semibold text-ink">Password</label>
					<input
						type="password"
						name="password"
						autoFocus
						autoComplete="current-password"
						className="w-full rounded-lg border border-line bg-white px-4 py-3.5 text-[17px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
						placeholder="Type your password"
					/>
				</div>
				{e && (
					<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] font-medium text-red-700">
						That password didn&apos;t match. Please try again.
					</p>
				)}
				<button className="w-full rounded-lg bg-brand px-4 py-3.5 text-[17px] font-bold text-white shadow-sm transition hover:brightness-110">
					Log in
				</button>
			</form>

			{/* ---- forgotten password ---- */}
			<details open={Boolean(r) || pending} className="mt-6 border-t border-line pt-4">
				<summary className="cursor-pointer list-none text-[15px] font-semibold text-brand">
					Forgotten your password?
				</summary>

				<div className="mt-3 space-y-3">
					{r === "sent" && (
						<p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-[14px] font-medium text-emerald-800">
							✓ We emailed a 6-digit code to {ownerEmail()}. Check that inbox (and spam), then
							type the code below with your new password.
						</p>
					)}
					{r === "nomail" && (
						<p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[14px] text-amber-800">
							Automatic email isn&apos;t switched on yet, so we can&apos;t send you a code.
							Please call your developer — they can get you back in straight away.
						</p>
					)}
					{r === "failed" && (
						<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-700">
							We couldn&apos;t send the email. Please call your developer.
						</p>
					)}
					{r && ["no_request", "expired", "too_many", "bad_code", "too_short", "mismatch"].includes(r) && (
						<p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-700">
							{r === "no_request" && "Ask for a code first using the button below."}
							{r === "expired" && "That code has expired. Ask for a new one."}
							{r === "too_many" && "Too many wrong codes. Ask for a new one."}
							{r === "bad_code" && "That code isn't right. Check the email and try again."}
							{r === "too_short" && `Your new password needs at least ${MIN_PASSWORD_LENGTH} letters or numbers.`}
							{r === "mismatch" && "The two new passwords don't match."}
						</p>
					)}

					{pending ? (
						<form action={submitReset} className="space-y-3">
							<label className="block text-[14.5px] font-semibold text-ink">
								Code from the email
								<input
									name="code"
									inputMode="numeric"
									placeholder="6 digits"
									className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[16px] text-ink outline-none focus:border-brand"
								/>
							</label>
							<label className="block text-[14.5px] font-semibold text-ink">
								New password
								<input
									type="password"
									name="newPassword"
									autoComplete="new-password"
									className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[16px] text-ink outline-none focus:border-brand"
								/>
							</label>
							<label className="block text-[14.5px] font-semibold text-ink">
								Type it again
								<input
									type="password"
									name="confirmPassword"
									autoComplete="new-password"
									className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[16px] text-ink outline-none focus:border-brand"
								/>
							</label>
							<button className="w-full rounded-lg bg-brand px-4 py-3 text-[16px] font-bold text-white hover:brightness-110">
								Set my new password
							</button>
						</form>
					) : (
						<>
							<p className="text-[14px] text-muted">
								{mail
									? `We'll email a one-time code to ${ownerEmail()}.`
									: "Automatic email isn't switched on yet — your developer can reset it for you."}
							</p>
							<form action={requestReset}>
								<button className="w-full rounded-lg border border-line bg-white px-4 py-2.5 text-[15px] font-semibold text-ink hover:bg-row">
									Email me a reset code
								</button>
							</form>
						</>
					)}
				</div>
			</details>
		</div>
	);
}
