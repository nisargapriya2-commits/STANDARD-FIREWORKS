"use client";

import { useState } from "react";
import { telLinkTo, waLinkTo } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";

const OCCASIONS = [
	"Deepavali",
	"Christmas / New Year",
	"Pongal",
	"Wedding / Temple function",
	"Other",
];

export default function EnquiryForm({
	whatsapp,
	phone,
	brand,
}: {
	whatsapp: string;
	phone: string;
	brand: string;
}) {
	const [sent, setSent] = useState(false);

	function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const f = new FormData(e.currentTarget);
		const get = (k: string) => String(f.get(k) ?? "").trim();

		const message =
			`Hi ${brand}, I'd like to enquire.\n\n` +
			`*Name:* ${get("name")}\n` +
			`*Phone:* ${get("phone")}\n` +
			(get("city") ? `*Delivering to:* ${get("city")}\n` : "") +
			`*Occasion:* ${get("occasion")}\n` +
			(get("message") ? `\n${get("message")}` : "");

		window.open(waLinkTo(whatsapp, message), "_blank", "noopener");
		setSent(true);
	}

	return (
		<div className="border border-line bg-white p-6">
			<h2 className="text-lg font-semibold text-ink">Send an enquiry</h2>
			<p className="mt-1 text-[15px] text-muted">
				This opens WhatsApp with your message ready to send. Nothing is ordered or charged
				here.
			</p>

			<form onSubmit={onSubmit} className="mt-5 space-y-4">
				<Field label="Your name" name="name" required placeholder="Name" />
				<Field
					label="Phone"
					name="phone"
					required
					placeholder="10-digit mobile"
					inputMode="tel"
				/>
				<Field
					label="Delivering to (city / pincode)"
					name="city"
					placeholder="e.g. Poonamallee, Chennai 600056"
				/>

				<div>
					<label
						htmlFor="occasion"
						className="mb-1.5 block text-[14px] font-semibold uppercase tracking-wider text-ink-soft"
					>
						Occasion
					</label>
					<select
						id="occasion"
						name="occasion"
						defaultValue={OCCASIONS[0]}
						className="w-full border border-line px-3 py-2.5 text-[16px] focus:border-brand focus:outline-none"
					>
						{OCCASIONS.map((o) => (
							<option key={o}>{o}</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="message"
						className="mb-1.5 block text-[14px] font-semibold uppercase tracking-wider text-ink-soft"
					>
						What do you need?
					</label>
					<textarea
						id="message"
						name="message"
						rows={4}
						placeholder="Rough budget, family size, or paste your list from the price list page…"
						className="w-full border border-line px-3 py-2.5 text-[16px] focus:border-brand focus:outline-none"
					/>
				</div>

				<button
					type="submit"
					className="flex w-full items-center justify-center gap-1.5 bg-[#25D366] py-3 text-[16px] font-semibold text-[#04331a] hover:brightness-95"
				>
					<WhatsAppIcon className="h-4 w-4" /> Send on WhatsApp
				</button>
			</form>

			{sent && (
				<p className="mt-3 text-center text-[15px] text-[#1a7f37]">
					✅ WhatsApp should have opened. If it didn&apos;t, call us on{" "}
					<a href={telLinkTo(phone)} className="font-semibold underline">
						{phone}
					</a>
					.
				</p>
			)}

			<p className="mt-4 text-center text-[14px] text-muted">
				Prefer to talk?{" "}
				<a href={telLinkTo(phone)} className="font-semibold text-brand hover:underline">
					Call us instead →
				</a>
			</p>
		</div>
	);
}

function Field({
	label,
	name,
	required,
	placeholder,
	inputMode,
}: {
	label: string;
	name: string;
	required?: boolean;
	placeholder?: string;
	inputMode?: "tel" | "text" | "numeric";
}) {
	return (
		<div>
			<label
				htmlFor={name}
				className="mb-1.5 block text-[14px] font-semibold uppercase tracking-wider text-ink-soft"
			>
				{label}
			</label>
			<input
				id={name}
				name={name}
				required={required}
				placeholder={placeholder}
				inputMode={inputMode}
				className="w-full border border-line px-3 py-2.5 text-[16px] focus:border-brand focus:outline-none"
			/>
		</div>
	);
}
