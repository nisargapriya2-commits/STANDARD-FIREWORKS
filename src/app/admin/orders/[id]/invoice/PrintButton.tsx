"use client";

export default function PrintButton() {
	return (
		<button
			type="button"
			onClick={() => window.print()}
			className="print:hidden rounded-lg bg-brand px-5 py-2.5 text-[15px] font-bold text-white hover:brightness-110"
		>
			🖨️ Print / Save as PDF
		</button>
	);
}
