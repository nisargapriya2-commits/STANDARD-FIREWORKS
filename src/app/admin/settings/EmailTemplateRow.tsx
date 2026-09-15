"use client";

import { useState } from "react";
import { SITE, fillTemplate } from "@/lib/site";
import { aLabel, aHint, aInput } from "@/lib/admin-ui";

const SAMPLE_VARS = {
	name: "Ravi",
	orderId: "FW202612345",
	area: "Anna Nagar",
	city: "Chennai",
	areaMap: "https://maps.app.goo.gl/example",
	shopName: SITE.name,
};

/**
 * One status's subject + message editor, with a live example underneath so
 * the owner can read the actual email a customer would get — in plain
 * English, not `{tokens}` — instead of having to imagine it.
 */
export default function EmailTemplateRow({
	status,
	label,
	defaultSubject,
	defaultBody,
	initialSubject,
	initialBody,
}: {
	status: string;
	label: string;
	defaultSubject: string;
	defaultBody: string;
	initialSubject: string;
	initialBody: string;
}) {
	const [subject, setSubject] = useState(initialSubject);
	const [body, setBody] = useState(initialBody);

	const vars = { ...SAMPLE_VARS, statusLabel: label };
	const previewSubject = fillTemplate(subject.trim() || defaultSubject, vars);
	const previewBody = fillTemplate(body.trim() || defaultBody, vars);

	return (
		<div className="rounded-xl border border-line bg-row p-3.5">
			<span className={aLabel}>{label}</span>
			<label className="mt-2 block">
				<span className="text-[13px] font-semibold text-muted">Subject line</span>
				<input
					name={`emailTplSubject::${status}`}
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					placeholder={defaultSubject}
					className={aInput}
				/>
			</label>
			<label className="mt-2 block">
				<span className="text-[13px] font-semibold text-muted">Message</span>
				<textarea
					name={`emailTpl::${status}`}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					placeholder={defaultBody}
					rows={3}
					className={aInput}
				/>
			</label>

			<div className="mt-2.5 rounded-lg border border-line bg-white p-3">
				<p className={aHint + " mb-1.5"}>
					📧 What Ravi (a made-up example customer) would actually receive:
				</p>
				<p className="text-[13.5px] font-semibold text-ink">{previewSubject}</p>
				<p className="mt-1 whitespace-pre-line text-[13.5px] leading-5 text-ink-soft">
					Hi Ravi, {previewBody}
					{"\n\n"}— {SITE.name}
				</p>
			</div>
		</div>
	);
}
