import QRCode from "qrcode";
import { SITE } from "@/lib/site";

export type UpiUriParams = {
	upiId: string;
	payeeName?: string;
	amount: number;
	orderId?: string | null;
	note?: string;
};

/**
 * Builds a standard NPCI UPI payment deep-link URI:
 * upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...&tr=...
 *
 * When scanned by any Indian UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.),
 * the `am` parameter automatically pre-fills the exact payment amount so
 * the customer does not have to enter it manually.
 */
export function buildUpiUri({
	upiId,
	payeeName,
	amount,
	orderId,
	note,
}: UpiUriParams): string {
	const pa = (upiId || SITE.upi || "example@upi").trim();
	const pn = (payeeName || SITE.legalName || SITE.name || "Murugan Traders").trim();
	const am = Math.max(0, amount).toFixed(2);
	const tn = (note || (orderId ? `Order ${orderId}` : "Fireworks Order")).trim();

	// Format parameters: keep @ unescaped in VPA for universal UPI scanner compatibility,
	// and use standard percent-encoding for payee name and transaction note.
	const parts = [
		`pa=${pa}`,
		`pn=${encodeURIComponent(pn)}`,
		`am=${am}`,
		`cu=INR`,
		`tn=${encodeURIComponent(tn)}`,
	];

	if (orderId) {
		parts.push(`tr=${encodeURIComponent(orderId.trim())}`);
	}

	return `upi://pay?${parts.join("&")}`;
}

/**
 * Generates a high-contrast, sharp PNG data URL for the UPI QR code.
 */
export async function generateUpiQrDataUrl(
	paramsOrUri: UpiUriParams | string,
	options: { width?: number; margin?: number } = {},
): Promise<string> {
	const uri = typeof paramsOrUri === "string" ? paramsOrUri : buildUpiUri(paramsOrUri);
	const { width = 360, margin = 1 } = options;

	return QRCode.toDataURL(uri, {
		width,
		margin,
		errorCorrectionLevel: "M",
		color: {
			dark: "#111827",
			light: "#ffffff",
		},
	});
}

/**
 * Generates an SVG string for vector-crisp rendering at any screen size.
 */
export async function generateUpiQrSvg(
	paramsOrUri: UpiUriParams | string,
	options: { margin?: number } = {},
): Promise<string> {
	const uri = typeof paramsOrUri === "string" ? paramsOrUri : buildUpiUri(paramsOrUri);
	const { margin = 1 } = options;

	return QRCode.toString(uri, {
		type: "svg",
		margin,
		errorCorrectionLevel: "M",
		color: {
			dark: "#111827",
			light: "#ffffff",
		},
	});
}
