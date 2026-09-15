/**
 * Bulk import/export for the State → City → Area delivery list.
 *
 * Supports arbitrary CSV, XLSX, or XLS spreadsheets with flexible column names
 * in any column order. Uses fuzzy alias matching and data heuristics to detect
 * State, City, Area/Address, Google Map Link, and Delivery Fee.
 *
 * If columns cannot be confidently resolved, returns an analysis result so the
 * admin can be shown a simple column-mapping step.
 */

import * as XLSX from "xlsx";
import { areaKey, cleanMapUrl, type ServiceArea, type Settings } from "@/lib/site";

export type DeliveryCsvRow = {
	state: string;
	fee: number | null;
	city: string;
	area: string; // Delivery point / hub name
	address?: string; // Street address / landmark
	pincode?: string; // Supporting postal code
	mapsLink: string;
};

export type ColumnMapping = {
	stateCol?: string; // column header name
	cityCol?: string;
	areaCol?: string; // delivery point / location / hub
	addressCol?: string; // street address / address
	pincodeCol?: string; // supporting postal code
	mapCol?: string;
	feeCol?: string;
};

export type SpreadsheetAnalysis = {
	headers: string[];
	sampleRows: string[][];
	totalRows: number;
	detectedMapping: ColumnMapping;
	confident: boolean;
};

/** Splits one CSV line on commas, respecting double-quoted fields (Excel's format). */
export function splitCsvLine(line: string): string[] {
	const out: string[] = [];
	let cur = "";
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (inQuotes) {
			if (c === '"') {
				if (line[i + 1] === '"') {
					cur += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				cur += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === ",") {
			out.push(cur);
			cur = "";
		} else {
			cur += c;
		}
	}
	out.push(cur);
	return out.map((s) => s.trim());
}

function csvCell(v: string): string {
	return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export const DELIVERY_CSV_HEADER = "State,DeliveryFee,City,Area,MapsLink";

/* ---- Header Normalization & Fuzzy Alias Resolution ---- */

export function normalizeHeader(h: string): string {
	return String(h ?? "")
		.toLowerCase()
		.replace(/[_\-./\\()[\]#:+]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

const STATE_ALIASES = [
	"state",
	"state name",
	"states",
	"destination state",
	"delivery state",
	"state ut",
	"state union territory",
	"province",
	"region",
	"st",
	"state code",
];

const CITY_ALIASES = [
	"city",
	"city name",
	"cities",
	"destination city",
	"delivery city",
	"town",
	"towns",
	"district",
	"dist",
	"city town",
	"place",
	"station",
];

const AREA_ALIASES = [
	"area",
	"areas",
	"area name",
	"delivery point",
	"delivery location",
	"pickup point",
	"pickup location",
	"hub",
	"hub name",
	"location name",
	"location",
	"branch",
	"branch name",
	"drop location",
	"locality",
	"sub area",
	"subarea",
	"point",
	"drop off point",
	"station",
];

const ADDRESS_ALIASES = [
	"original address",
	"address with pincode",
	"street address",
	"address",
	"addresses",
	"delivery address",
	"street",
	"full address",
	"office address",
	"location address",
	"door no",
	"premises",
];

const PINCODE_ALIASES = [
	"pincode",
	"pincodes",
	"pin code",
	"pin codes",
	"postcode",
	"postcodes",
	"postal code",
	"postal codes",
	"pin",
	"zip",
	"zipcode",
	"zip code",
	"original post code field",
];

const MAP_ALIASES = [
	"google map link",
	"google map url",
	"google maps link",
	"google maps url",
	"gmap link",
	"gmaps link",
	"gmap url",
	"gmaps url",
	"map link",
	"maps link",
	"map url",
	"maps url",
	"google map",
	"google maps",
	"gmap",
	"gmaps",
	"map",
	"maps",
	"location link",
	"pin link",
	"map pin",
	"google pin",
	"gps link",
	"coordinates",
	"link",
	"url",
];

const FEE_ALIASES = [
	"deliveryfee",
	"delivery fee",
	"delivery fees",
	"fee",
	"fees",
	"transport fee",
	"transport fees",
	"shipping fee",
	"freight",
	"transport charge",
	"delivery charge",
	"shipping charge",
	"charge",
	"charges",
	"rate",
	"delivery cost",
	"shipping cost",
	"state fee",
	"transport cost",
	"shipping rate",
];

const KNOWN_STATES = new Set([
	"tamil nadu",
	"tamilnadu",
	"kerala",
	"karnataka",
	"andhra pradesh",
	"andhra",
	"telangana",
	"maharashtra",
	"pondicherry",
	"puducherry",
	"goa",
	"odisha",
	"orissa",
	"gujarat",
	"delhi",
	"rajasthan",
	"madhya pradesh",
	"west bengal",
	"bihar",
	"punjab",
	"haryana",
	"uttar pradesh",
]);

function isMapUrl(val: string): boolean {
	const v = val.toLowerCase().trim();
	return (
		v.includes("google.com/maps") ||
		v.includes("goo.gl/maps") ||
		v.includes("maps.app.goo.gl") ||
		v.includes("maps.google")
	);
}

function cell(row: unknown[], i: number): string {
	return i >= 0 && row && row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : "";
}

/**
 * Analyzes spreadsheet headers and data rows to automatically detect column mapping.
 */
export function analyzeSpreadsheet(headerRow: unknown[], dataRows: unknown[][]): SpreadsheetAnalysis {
	const headers = headerRow.map((h) => String(h ?? "").trim()).filter((h) => h.length > 0);
	const normHeaders = headers.map(normalizeHeader);
	const sampleRows: string[][] = dataRows.slice(0, 5).map((row) => headers.map((_, i) => cell(row, i)));

	const findByAlias = (aliases: string[]): number => {
		for (const alias of aliases) {
			const idx = normHeaders.indexOf(alias);
			if (idx >= 0) return idx;
		}
		// Partial containment fallback (e.g. "delivery state name" contains "state")
		for (const alias of aliases) {
			const idx = normHeaders.findIndex((h) => h.includes(alias) || alias.includes(h));
			if (idx >= 0) return idx;
		}
		return -1;
	};

	let iState = findByAlias(STATE_ALIASES);
	let iCity = findByAlias(CITY_ALIASES);
	let iPincode = findByAlias(PINCODE_ALIASES);
	let iAddress = findByAlias(ADDRESS_ALIASES);
	let iArea = findByAlias(AREA_ALIASES);
	let iMap = findByAlias(MAP_ALIASES);
	let iFee = findByAlias(FEE_ALIASES);

	// Special case: "location" header
	const iLocation = normHeaders.findIndex((h) => h === "location" || h.includes("location"));
	if (iLocation >= 0) {
		if (iCity < 0) {
			iCity = iLocation;
		} else if (iArea < 0 && iLocation !== iCity) {
			iArea = iLocation;
		}
	}

	// Pincode column must NEVER be mapped as the Area/Delivery Point display name
	if (iPincode >= 0) {
		if (iArea === iPincode) iArea = -1;
		if (iAddress === iPincode) iAddress = -1;
	}

	// Data-level heuristics if header was ambiguous or missing
	for (let col = 0; col < headers.length; col++) {
		const colValues = dataRows.slice(0, 20).map((r) => cell(r, col)).filter((v) => v.length > 0);
		if (!colValues.length) continue;

		// Check for Google Maps URLs
		if (iMap < 0 || iMap === col) {
			const mapCount = colValues.filter(isMapUrl).length;
			if (mapCount > 0) {
				iMap = col;
			}
		}

		// Check for Indian State names
		if (iState < 0) {
			const stateMatches = colValues.filter((v) => KNOWN_STATES.has(v.toLowerCase())).length;
			if (stateMatches >= 2 || (colValues.length === 1 && stateMatches === 1)) {
				iState = col;
			}
		}

		// Check for Pincodes (6-digit numbers)
		if (iPincode < 0 && col !== iState && col !== iCity && col !== iMap) {
			const pinCount = colValues.filter((v) => /^\d{6}$/.test(v.trim())).length;
			if (pinCount >= Math.min(2, colValues.length)) {
				iPincode = col;
				if (iArea === col) iArea = -1;
				if (iAddress === col) iAddress = -1;
			}
		}

		// Check for Delivery Fee (all numeric positive integers, and not already State, City, Map, or Pincode)
		if (iFee < 0 && col !== iState && col !== iCity && col !== iMap && col !== iPincode) {
			const normH = normHeaders[col];
			const isFeeNamed =
				normH.includes("fee") ||
				normH.includes("charge") ||
				normH.includes("rate") ||
				normH.includes("freight") ||
				normH.includes("cost") ||
				normH.includes("price") ||
				normH.includes("amount");
			const numCount = colValues.filter((v) => /^\d+(\.\d+)?$/.test(v.replace(/[₹,\s]/g, ""))).length;
			if (isFeeNamed && numCount >= Math.min(2, colValues.length)) {
				iFee = col;
			}
		}
	}

	// Ensure no column is double-mapped to two distinct fields
	const used = new Set<number>();
	if (iState >= 0) used.add(iState);

	if (iCity >= 0) {
		if (used.has(iCity)) iCity = -1;
		else used.add(iCity);
	}

	if (iPincode >= 0) {
		if (used.has(iPincode)) iPincode = -1;
		else used.add(iPincode);
	}

	if (iAddress >= 0) {
		if (used.has(iAddress)) iAddress = -1;
		else used.add(iAddress);
	}

	if (iArea >= 0) {
		if (used.has(iArea)) iArea = -1;
		else used.add(iArea);
	}

	if (iMap >= 0) {
		if (used.has(iMap)) iMap = -1;
		else used.add(iMap);
	}

	if (iFee >= 0) {
		if (used.has(iFee)) iFee = -1;
		else used.add(iFee);
	}

	const detectedMapping: ColumnMapping = {
		stateCol: iState >= 0 ? headers[iState] : undefined,
		cityCol: iCity >= 0 ? headers[iCity] : undefined,
		areaCol: iArea >= 0 ? headers[iArea] : undefined,
		addressCol: iAddress >= 0 ? headers[iAddress] : undefined,
		pincodeCol: iPincode >= 0 ? headers[iPincode] : undefined,
		mapCol: iMap >= 0 ? headers[iMap] : undefined,
		feeCol: iFee >= 0 ? headers[iFee] : undefined,
	};

	// Confident if both State and City are cleanly identified without conflicts
	const confident = Boolean(detectedMapping.stateCol && detectedMapping.cityCol);

	return {
		headers,
		sampleRows,
		totalRows: dataRows.length,
		detectedMapping,
		confident,
	};
}

/**
 * Maps raw spreadsheet rows into DeliveryCsvRow[] using either explicit or auto-detected mapping.
 */
export function mapRowsWithMapping(
	headerRow: unknown[],
	dataRows: unknown[][],
	mapping: ColumnMapping,
): DeliveryCsvRow[] {
	const headers = headerRow.map((h) => String(h ?? "").trim());

	const getIndex = (colName?: string): number => {
		if (!colName) return -1;
		const norm = normalizeHeader(colName);
		// Try exact match first
		const exact = headers.indexOf(colName);
		if (exact >= 0) return exact;
		// Try normalized
		return headers.map(normalizeHeader).indexOf(norm);
	};

	const iState = getIndex(mapping.stateCol);
	const iCity = getIndex(mapping.cityCol);
	const iArea = getIndex(mapping.areaCol);
	const iAddress = getIndex(mapping.addressCol);
	const iPincode = getIndex(mapping.pincodeCol);
	const iMap = getIndex(mapping.mapCol);
	const iFee = getIndex(mapping.feeCol);

	// Check if there is an explicit "Location" column for Chennai transport sheets
	const iLocation = headers.map(normalizeHeader).indexOf("location");

	if (iState < 0 || iCity < 0) return [];

	const rows: DeliveryCsvRow[] = [];
	for (const r of dataRows) {
		const state = cell(r, iState);
		if (!state) continue;

		const feeRaw = cell(r, iFee);
		const cleanFee = feeRaw.replace(/[₹,\s]/g, "");
		const fee = cleanFee !== "" && Number.isFinite(Number(cleanFee)) ? Math.max(0, Math.floor(Number(cleanFee))) : null;

		const city = cell(r, iCity);
		if (!city) continue;

		let area = iArea >= 0 ? cell(r, iArea) : "";
		let address = iAddress >= 0 ? cell(r, iAddress) : "";
		let pincode = iPincode >= 0 ? cell(r, iPincode) : "";

		// Transport sheet compatibility: if city is Chennai, and "Location" has a distinct area name
		if (!area && city.toLowerCase() === "chennai" && iLocation >= 0 && iLocation !== iCity) {
			const locVal = cell(r, iLocation);
			if (locVal) area = locVal;
		}

		// If area is raw 6-digit pincode, move it to pincode and clear area
		if (/^\d{6}$/.test(area.trim())) {
			if (!pincode) pincode = area.trim();
			area = "";
		}

		// If address exists, inspect if it contains delimiter `<Delivery Point> — <Address>`
		if (address) {
			const normAddr = address.replace(/[\u2014\u2013\u2212]/g, " — ");
			const parts = normAddr.split(/\s*—\s*|\s+-\s+|\s*\|\s*/);
			if (parts.length >= 2) {
				if (!area) {
					area = parts[0].trim();
				}
				address = parts.slice(1).join(" — ").trim();
			} else if (!area) {
				area = address;
				address = "";
			}
		}

		// Clean trailing pincode from address (e.g. "... - 600077")
		if (address) {
			const pinMatch = address.match(/[-,\s]+(\d{6})$/);
			if (pinMatch) {
				if (!pincode) pincode = pinMatch[1];
				address = address.replace(/[-,\s]+(\d{6})$/, "").trim();
			}
		}

		// Never allow area name to remain as raw 6-digit pincode
		if (/^\d{6}$/.test(area.trim())) {
			if (!pincode) pincode = area.trim();
			area = address || "";
			address = "";
		}

		rows.push({
			state,
			fee,
			city,
			area,
			address: address || undefined,
			pincode: pincode || undefined,
			mapsLink: cell(r, iMap),
		});
	}

	return rows;
}

/**
 * Parses raw text or array buffer into header and data row arrays.
 */
export function extractSpreadsheetRows(data: ArrayBuffer | Uint8Array | string): {
	headerRow: string[];
	dataRows: unknown[][];
} {
	if (typeof data === "string") {
		const lines = data.split(/\r?\n/).filter((l) => l.trim().length > 0);
		if (lines.length < 2) return { headerRow: [], dataRows: [] };
		return {
			headerRow: splitCsvLine(lines[0]),
			dataRows: lines.slice(1).map(splitCsvLine),
		};
	}

	try {
		const wb = XLSX.read(data, { type: "array" });
		const sheet = wb.Sheets[wb.SheetNames[0]];
		if (!sheet) return { headerRow: [], dataRows: [] };
		const sheetRows = XLSX.utils.sheet_to_json(sheet, {
			header: 1,
			defval: "",
			blankrows: false,
		}) as unknown[][];
		if (sheetRows.length < 2) return { headerRow: [], dataRows: [] };
		return {
			headerRow: sheetRows[0].map((h) => String(h ?? "").trim()),
			dataRows: sheetRows.slice(1),
		};
	} catch {
		return { headerRow: [], dataRows: [] };
	}
}

/** Parses uploaded CSV text into rows. Uses mapping if provided, or auto-detects. */
export function parseDeliveryCsv(text: string, mapping?: ColumnMapping): DeliveryCsvRow[] {
	const { headerRow, dataRows } = extractSpreadsheetRows(text);
	if (!headerRow.length || !dataRows.length) return [];

	if (mapping && mapping.stateCol && mapping.cityCol) {
		return mapRowsWithMapping(headerRow, dataRows, mapping);
	}

	const analysis = analyzeSpreadsheet(headerRow, dataRows);
	if (!analysis.confident) return [];
	return mapRowsWithMapping(headerRow, dataRows, analysis.detectedMapping);
}

/** Parses an uploaded Excel workbook (.xlsx/.xls). Uses mapping if provided, or auto-detects. */
export function parseDeliveryWorkbook(
	data: ArrayBuffer | Uint8Array,
	mapping?: ColumnMapping,
): DeliveryCsvRow[] {
	const { headerRow, dataRows } = extractSpreadsheetRows(data);
	if (!headerRow.length || !dataRows.length) return [];

	if (mapping && mapping.stateCol && mapping.cityCol) {
		return mapRowsWithMapping(headerRow, dataRows, mapping);
	}

	const analysis = analyzeSpreadsheet(headerRow, dataRows);
	if (!analysis.confident) return [];
	return mapRowsWithMapping(headerRow, dataRows, analysis.detectedMapping);
}

/** Builds a CSV of the CURRENT delivery list — doubles as the "template" download. */
export function buildDeliveryCsv(s: Settings): string {
	const lines = ["State,DeliveryFee,City,Area,Address,Pincode,MapsLink"];
	for (const state of s.serviceStates) {
		const fee = s.transportFees[state] ?? 0;
		const cities = s.serviceCities[state] ?? [];
		if (!cities.length) {
			lines.push([csvCell(state), String(fee), "", "", "", "", ""].join(","));
			continue;
		}
		for (const city of cities) {
			const areas = s.serviceAreas[areaKey(state, city)] ?? [];
			if (!areas.length) {
				lines.push([csvCell(state), String(fee), csvCell(city), "", "", "", ""].join(","));
			} else {
				for (const a of areas) {
					lines.push([
						csvCell(state),
						String(fee),
						csvCell(city),
						csvCell(a.name),
						csvCell(a.address || ""),
						csvCell(a.pincode || ""),
						csvCell(a.mapUrl),
					].join(","));
				}
			}
		}
	}
	return lines.join("\r\n") + "\r\n";
}

/** Merges parsed rows (from CSV or Excel) on top of the current settings. Returns the new delivery fields. */
export function mergeDeliveryImport(
	cur: Settings,
	rows: DeliveryCsvRow[],
): Pick<Settings, "serviceStates" | "transportFees" | "serviceCities" | "serviceAreas"> {
	const serviceStatesSet = new Set(cur.serviceStates);
	const transportFees: Record<string, number> = { ...cur.transportFees };
	const serviceCities: Record<string, string[]> = Object.fromEntries(
		Object.entries(cur.serviceCities).map(([k, v]) => [k, [...v]]),
	);
	const serviceAreas: Record<string, ServiceArea[]> = Object.fromEntries(
		Object.entries(cur.serviceAreas).map(([k, v]) => [k, v.map((a) => ({ ...a }))]),
	);

	for (const row of rows) {
		const state = row.state.trim();
		if (!state) continue;
		serviceStatesSet.add(state);
		if (row.fee !== null) transportFees[state] = row.fee;

		const city = row.city.trim();
		if (!city) continue;
		const cities = serviceCities[state] ?? (serviceCities[state] = []);
		if (!cities.some((c) => c.toLowerCase() === city.toLowerCase())) cities.push(city);

		const area = row.area.trim();
		if (!area) continue;
		const key = areaKey(state, city);
		const areas = serviceAreas[key] ?? (serviceAreas[key] = []);
		const mapUrl = cleanMapUrl(row.mapsLink || "");
		const existing = areas.find((a) => a.name.toLowerCase() === area.toLowerCase());
		if (existing) {
			if (mapUrl) existing.mapUrl = mapUrl;
			if (row.address) existing.address = row.address;
			if (row.pincode) existing.pincode = row.pincode;
		} else {
			areas.push({
				name: area,
				...(row.address ? { address: row.address } : {}),
				...(row.pincode ? { pincode: row.pincode } : {}),
				mapUrl,
			});
		}
	}

	return {
		serviceStates: [...serviceStatesSet],
		transportFees,
		serviceCities,
		serviceAreas,
	};
}
