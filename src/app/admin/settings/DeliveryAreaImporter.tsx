"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	analyzeDeliverySpreadsheetAction,
	executeDeliveryImportAction,
} from "./actions";
import type { ColumnMapping, SpreadsheetAnalysis } from "@/lib/delivery-csv";

interface DeliveryAreaImporterProps {
	initialImportMsg?: string | null;
}

export default function DeliveryAreaImporter({ initialImportMsg }: DeliveryAreaImporterProps) {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [isPending, startTransition] = useTransition();
	const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(() => {
		if (initialImportMsg && /^\d+$/.test(initialImportMsg)) {
			return {
				type: "success",
				text: `✓ Imported ${initialImportMsg} row${initialImportMsg === "1" ? "" : "s"} — already saved and live. Check the Delivery card further down the page.`,
			};
		}
		if (initialImportMsg === "badfile") {
			return {
				type: "error",
				text: "Couldn't find a usable State or City column in that file — please check the column headings or map them manually.",
			};
		}
		if (initialImportMsg === "empty") {
			return { type: "error", text: "Choose a CSV or Excel file first." };
		}
		return null;
	});

	// Mapping step state
	const [stagedImport, setStagedImport] = useState<{
		filename: string;
		fileType: "csv" | "xlsx";
		rawBase64: string;
		analysis: SpreadsheetAnalysis;
	} | null>(null);

	const [mapping, setMapping] = useState<ColumnMapping>({});

	const handleFileSelect = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const files = fileInputRef.current?.files;
		if (!files || files.length === 0) {
			setStatusMsg({ type: "error", text: "Please select a CSV or Excel file to upload." });
			return;
		}

		setStatusMsg(null);
		const formData = new FormData();
		formData.append("deliveryFile", files[0]);

		startTransition(async () => {
			const res = await analyzeDeliverySpreadsheetAction(formData);
			if (!res.success || !res.analysis || !res.rawBase64 || !res.fileType) {
				setStatusMsg({ type: "error", text: res.error || "Could not read spreadsheet." });
				return;
			}

			// If columns are confidently identified, import immediately without prompting
			if (res.analysis.confident) {
				const importRes = await executeDeliveryImportAction({
					rawBase64: res.rawBase64,
					fileType: res.fileType,
					mapping: res.analysis.detectedMapping,
				});

				if (importRes.success) {
					setStatusMsg({
						type: "success",
						text: `✓ Imported ${importRes.count} row${importRes.count === 1 ? "" : "s"} — already saved and live. Check the Delivery card further down the page.`,
					});
					if (fileInputRef.current) fileInputRef.current.value = "";
					router.refresh();
				} else {
					setStatusMsg({ type: "error", text: importRes.error || "Failed to import rows." });
				}
				return;
			}

			// Otherwise, show the interactive column mapping step
			setStagedImport({
				filename: res.filename || files[0].name,
				fileType: res.fileType,
				rawBase64: res.rawBase64,
				analysis: res.analysis,
			});
			setMapping(res.analysis.detectedMapping);
		});
	};

	const handleConfirmMapping = () => {
		if (!stagedImport) return;
		if (!mapping.stateCol || !mapping.cityCol) {
			setStatusMsg({
				type: "error",
				text: "Please select both a State column and a City column before importing.",
			});
			return;
		}

		startTransition(async () => {
			const res = await executeDeliveryImportAction({
				rawBase64: stagedImport.rawBase64,
				fileType: stagedImport.fileType,
				mapping,
			});

			if (res.success) {
				setStatusMsg({
					type: "success",
					text: `✓ Imported ${res.count} row${res.count === 1 ? "" : "s"} — already saved and live. Check the Delivery card further down the page.`,
				});
				setStagedImport(null);
				if (fileInputRef.current) fileInputRef.current.value = "";
				router.refresh();
			} else {
				setStatusMsg({ type: "error", text: res.error || "Failed to import rows." });
			}
		});
	};

	const handleCancelMapping = () => {
		setStagedImport(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<div>
			{statusMsg && (
				<p
					className={`mb-3 rounded-lg border px-3 py-2 text-[13.5px] ${
						statusMsg.type === "success"
							? "border-emerald-300 bg-emerald-50 text-emerald-800"
							: "border-red-200 bg-red-50 text-red-700"
					}`}
				>
					{statusMsg.text}
				</p>
			)}

			<div className="flex flex-wrap items-center gap-2">
				<a
					href="/api/admin/delivery-csv"
					className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] font-semibold text-ink hover:bg-row"
				>
					⬇️ Download current list as CSV
				</a>
			</div>

			{!stagedImport ? (
				<>
					<form onSubmit={handleFileSelect} className="mt-3 flex flex-wrap items-center gap-2">
						<input
							ref={fileInputRef}
							type="file"
							name="deliveryFile"
							accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
							required
							disabled={isPending}
							className="text-[14px] text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-[14px] file:font-semibold file:text-white hover:file:brightness-110 disabled:opacity-50"
						/>
						<button
							type="submit"
							disabled={isPending}
							className="rounded-lg bg-brand px-4 py-2.5 text-[14px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
						>
							{isPending ? "Processing..." : "Import file"}
						</button>
					</form>
					<p className="mt-2 text-[13.5px] text-muted leading-relaxed">
						Upload any spreadsheet (.xlsx, .xls, or .csv) containing your delivery areas. Columns
						like State, City, Area, Map Link, and Delivery Fee are detected automatically in any
						order, and extra columns are ignored. If any column cannot be recognized, a quick
						mapping step will appear before importing.
					</p>
				</>
			) : (
				/* Interactive Column Mapping Step */
				<div className="mt-4 rounded-xl border-2 border-brand/40 bg-brand/5 p-4 sm:p-5">
					<div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
						<div>
							<h3 className="text-[16px] font-extrabold text-ink">
								Map Columns for &ldquo;{stagedImport.filename}&rdquo;
							</h3>
							<p className="text-[13.5px] text-ink-soft">
								Found {stagedImport.analysis.totalRows} data row
								{stagedImport.analysis.totalRows === 1 ? "" : "s"}. Please match your spreadsheet
								columns to the fields below:
							</p>
						</div>
						<button
							type="button"
							onClick={handleCancelMapping}
							disabled={isPending}
							className="text-[13px] font-semibold text-muted hover:text-ink hover:underline"
						>
							✕ Cancel
						</button>
					</div>

					<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{/* State */}
						<div>
							<label className="block text-[13px] font-bold text-ink">
								State Column <span className="text-red-600">*</span>
							</label>
							<select
								value={mapping.stateCol || ""}
								onChange={(e) => setMapping((m) => ({ ...m, stateCol: e.target.value || undefined }))}
								className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand"
							>
								<option value="">-- Select State Column --</option>
								{stagedImport.analysis.headers.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>

						{/* City */}
						<div>
							<label className="block text-[13px] font-bold text-ink">
								City / Town Column <span className="text-red-600">*</span>
							</label>
							<select
								value={mapping.cityCol || ""}
								onChange={(e) => setMapping((m) => ({ ...m, cityCol: e.target.value || undefined }))}
								className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand"
							>
								<option value="">-- Select City Column --</option>
								{stagedImport.analysis.headers.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>

						{/* Area / Delivery Point / Hub */}
						<div>
							<label className="block text-[13px] font-bold text-ink">
								Area / Delivery Point / Hub <span className="text-muted font-normal">(optional)</span>
							</label>
							<select
								value={mapping.areaCol || ""}
								onChange={(e) => setMapping((m) => ({ ...m, areaCol: e.target.value || undefined }))}
								className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand"
							>
								<option value="">-- (None / Blank) --</option>
								{stagedImport.analysis.headers.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>

						{/* Address / Street Address */}
						<div>
							<label className="block text-[13px] font-bold text-ink">
								Address / Street Address <span className="text-muted font-normal">(optional)</span>
							</label>
							<select
								value={mapping.addressCol || ""}
								onChange={(e) => setMapping((m) => ({ ...m, addressCol: e.target.value || undefined }))}
								className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand"
							>
								<option value="">-- (None / Blank) --</option>
								{stagedImport.analysis.headers.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>

						{/* Pincode (supporting postal code) */}
						<div>
							<label className="block text-[13px] font-bold text-ink">
								Pincode / Postal Code <span className="text-muted font-normal">(supporting data only)</span>
							</label>
							<select
								value={mapping.pincodeCol || ""}
								onChange={(e) => setMapping((m) => ({ ...m, pincodeCol: e.target.value || undefined }))}
								className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand"
							>
								<option value="">-- (None / Blank) --</option>
								{stagedImport.analysis.headers.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>

						{/* Google Map Link */}
						<div>
							<label className="block text-[13px] font-bold text-ink">
								Google Map Link <span className="text-muted font-normal">(optional)</span>
							</label>
							<select
								value={mapping.mapCol || ""}
								onChange={(e) => setMapping((m) => ({ ...m, mapCol: e.target.value || undefined }))}
								className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand"
							>
								<option value="">-- (None / Blank) --</option>
								{stagedImport.analysis.headers.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>

						{/* Delivery Fee */}
						<div>
							<label className="block text-[13px] font-bold text-ink">
								Delivery Fee (₹) <span className="text-muted font-normal">(optional)</span>
							</label>
							<select
								value={mapping.feeCol || ""}
								onChange={(e) => setMapping((m) => ({ ...m, feeCol: e.target.value || undefined }))}
								className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-brand"
							>
								<option value="">-- (None / Blank) --</option>
								{stagedImport.analysis.headers.map((h) => (
									<option key={h} value={h}>
										{h}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Preview of file rows */}
					<div className="mt-4">
						<h4 className="text-[13px] font-bold uppercase tracking-wide text-muted">
							Data Preview (first {stagedImport.analysis.sampleRows.length} rows)
						</h4>
						<div className="mt-1.5 overflow-x-auto rounded-lg border border-line bg-white shadow-xs">
							<table className="w-full min-w-[500px] border-collapse text-[13px]">
								<thead>
									<tr className="bg-row text-left font-semibold text-ink-soft">
										{stagedImport.analysis.headers.map((h) => (
											<th key={h} className="border-b border-line px-3 py-2">
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{stagedImport.analysis.sampleRows.map((row, rIdx) => (
										<tr key={rIdx} className="border-b border-line/60 hover:bg-row/50">
											{row.map((val, cIdx) => (
												<td
													key={cIdx}
													className="max-w-[200px] truncate px-3 py-1.5 text-ink-soft"
													title={val}
												>
													{val || "—"}
												</td>
											))}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
						<button
							type="button"
							onClick={handleCancelMapping}
							disabled={isPending}
							className="rounded-lg border border-line bg-white px-4 py-2 text-[14px] font-semibold text-ink-soft hover:bg-row disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleConfirmMapping}
							disabled={isPending || !mapping.stateCol || !mapping.cityCol}
							className="rounded-lg bg-brand px-5 py-2 text-[14px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
						>
							{isPending ? "Importing..." : "Confirm & Import Areas"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
