/**
 * Admin auth for the panel.
 *
 * The password now lives in D1 (hashed with PBKDF2) so the owner can change it
 * himself. `ADMIN_PASSWORD` from the Worker env still works as a **recovery**
 * password — that is deliberate: this is a single-owner shop with no IT support,
 * and without a break-glass route a forgotten password means a locked-out
 * business during Deepavali week.
 *
 * Sessions are bound to a version number that increments on every password
 * change, so changing the password signs out every other device.
 *
 * Stored in the existing key/value `settings` table under `auth` — no migration.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { settingsTable } from "@/lib/catalog";

const COOKIE = "sf_admin";
const KEY = "auth";
const ITERATIONS = 210_000;
const RESET_TTL_MS = 20 * 60 * 1000;
const RESET_MAX_TRIES = 5;
/** Short enough to type from a phone, long enough not to be guessed in 5 tries. */
const RESET_CODE_DIGITS = 6;

export const MIN_PASSWORD_LENGTH = 8;

type ResetState = { codeHash: string; expiresAt: number; tries: number };

type AuthRecord = {
	hash: string; // pbkdf2$<iterations>$<saltB64>$<hashB64>
	updatedAt: number;
	version: number; // bumped on every change -> invalidates old cookies
	reset: ResetState | null;
	/** Only used when ADMIN_SESSION_SECRET isn't configured — see signingSecret(). */
	sessionSecret?: string;
};

function env() {
	return getCloudflareContext().env as unknown as {
		ADMIN_PASSWORD?: string;
		ADMIN_SESSION_SECRET?: string;
	};
}

function db() {
	const { env: e } = getCloudflareContext();
	if (!e.DB) throw new Error("D1 binding 'DB' is not configured.");
	return drizzle(e.DB, { schema: { settingsTable } });
}

/* ---------- base64 / constant-time compare ---------- */

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Compares without leaking where the first difference is. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
	return diff === 0;
}

function sameString(a: string, b: string): boolean {
	return sameBytes(new TextEncoder().encode(a), new TextEncoder().encode(b));
}

/* ---------- password hashing (PBKDF2 — available in Workers) ---------- */

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
		key,
		256,
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await pbkdf2(password, salt, ITERATIONS);
	return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

async function matchesHash(password: string, stored: string): Promise<boolean> {
	const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
	if (scheme !== "pbkdf2") return false;
	const iterations = Number(iterStr);
	if (!Number.isFinite(iterations) || iterations <= 0) return false;
	try {
		const got = await pbkdf2(password, unb64(saltB64), iterations);
		return sameBytes(got, unb64(hashB64));
	} catch {
		return false;
	}
}

/* ---------- the stored auth record ---------- */

async function readAuth(): Promise<AuthRecord | null> {
	try {
		const rows = await db()
			.select()
			.from(settingsTable)
			.where(eq(settingsTable.key, KEY))
			.limit(1);
		return rows[0] ? (JSON.parse(rows[0].value) as AuthRecord) : null;
	} catch {
		return null;
	}
}

async function writeAuth(rec: AuthRecord): Promise<void> {
	const d = db();
	const value = JSON.stringify(rec);
	const existing = await d
		.select({ key: settingsTable.key })
		.from(settingsTable)
		.where(eq(settingsTable.key, KEY))
		.limit(1);
	if (existing[0]) {
		await d.update(settingsTable).set({ value }).where(eq(settingsTable.key, KEY));
	} else {
		await d.insert(settingsTable).values({ key: KEY, value });
	}
}

/** True once the owner has set his own password (i.e. isn't on the dev's default). */
export async function hasOwnPassword(): Promise<boolean> {
	return (await readAuth()) !== null;
}

/* ---------- session ---------- */

async function sign(value: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
	return b64(new Uint8Array(sig));
}

/**
 * The key the session cookie is signed with.
 *
 * Normally the `ADMIN_SESSION_SECRET` Worker secret. If that was never set, we
 * mint a random one and keep it in D1 rather than falling back to a constant —
 * a hard-coded fallback is published in the source, so anyone could forge an
 * admin cookie against a deployment that forgot to set the secret.
 */
async function signingSecret(rec: AuthRecord | null): Promise<string> {
	const fromEnv = env().ADMIN_SESSION_SECRET;
	if (fromEnv) return fromEnv;
	if (rec?.sessionSecret) return rec.sessionSecret;

	const secret = `${crypto.randomUUID()}${crypto.randomUUID()}`;
	await writeAuth({
		hash: rec?.hash ?? (await hashPassword(env().ADMIN_PASSWORD || crypto.randomUUID())),
		updatedAt: rec?.updatedAt ?? Date.now(),
		version: rec?.version ?? 0,
		reset: rec?.reset ?? null,
		sessionSecret: secret,
	});
	return secret;
}

/**
 * Cookie value = HMAC over the current password version, so every existing
 * session dies the moment the password changes.
 */
async function expectedToken(): Promise<string> {
	const rec = await readAuth();
	const secret = await signingSecret(rec);
	return sign(`admin-ok:v${rec?.version ?? 0}`, secret);
}

export async function createSession(): Promise<void> {
	const token = await expectedToken();
	const store = await cookies();
	store.set(COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		// Secure in production (the Worker is always https). Off in `next dev`,
		// because a Secure cookie is dropped over plain http://localhost — which
		// otherwise makes it impossible to log into the admin panel locally.
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60 * 12, // 12h
	});
}

export async function destroySession(): Promise<void> {
	const store = await cookies();
	store.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
	const store = await cookies();
	const token = store.get(COOKIE)?.value;
	if (!token) return false;
	return sameString(token, await expectedToken());
}

/** Call at the top of every protected admin page/action. Redirects if not logged in. */
export async function requireAdmin(): Promise<void> {
	if (!(await isAuthed())) redirect("/admin/login");
}

/* ---------- login ---------- */

/**
 * The owner's own password wins; the env password always works too, as the
 * documented recovery route.
 */
export async function verifyPassword(password: string): Promise<boolean> {
	if (!password) return false;

	const rec = await readAuth();
	if (rec && (await matchesHash(password, rec.hash))) return true;

	const envPw = env().ADMIN_PASSWORD || "";
	return envPw.length > 0 && sameString(password, envPw);
}

/* ---------- change password ---------- */

export type PasswordError = "wrong_current" | "too_short" | "mismatch" | "same_as_current";

/**
 * Returns null on success. The caller gets a fresh session because bumping the
 * version deliberately invalidates the cookie that made this request.
 */
export async function changePassword(
	current: string,
	next: string,
	confirm: string,
): Promise<PasswordError | null> {
	if (!(await verifyPassword(current))) return "wrong_current";
	if (next.length < MIN_PASSWORD_LENGTH) return "too_short";
	if (next !== confirm) return "mismatch";
	if (next === current) return "same_as_current";

	const rec = await readAuth();
	await writeAuth({
		hash: await hashPassword(next),
		updatedAt: Date.now(),
		version: (rec?.version ?? 0) + 1,
		reset: null,
		sessionSecret: rec?.sessionSecret,
	});
	await createSession();
	return null;
}

/* ---------- forgotten password ---------- */

function newResetCode(): string {
	const digits = crypto.getRandomValues(new Uint8Array(RESET_CODE_DIGITS));
	let s = "";
	for (let i = 0; i < RESET_CODE_DIGITS; i++) s += String(digits[i] % 10);
	return s;
}

/**
 * Creates a one-time code and returns it so the caller can email it. The code
 * itself is only ever stored hashed.
 */
export async function startPasswordReset(): Promise<string> {
	const code = newResetCode();
	const rec = await readAuth();
	await writeAuth({
		// No password set yet? Seed from the env one so the record is valid either way.
		hash: rec?.hash ?? (await hashPassword(env().ADMIN_PASSWORD || crypto.randomUUID())),
		updatedAt: rec?.updatedAt ?? Date.now(),
		version: rec?.version ?? 0,
		reset: {
			codeHash: await hashPassword(code),
			expiresAt: Date.now() + RESET_TTL_MS,
			tries: 0,
		},
		sessionSecret: rec?.sessionSecret,
	});
	return code;
}

export type ResetError = "no_request" | "expired" | "too_many" | "bad_code" | "too_short" | "mismatch";

export async function completePasswordReset(
	code: string,
	next: string,
	confirm: string,
): Promise<ResetError | null> {
	const rec = await readAuth();
	if (!rec?.reset) return "no_request";
	if (rec.reset.expiresAt < Date.now()) return "expired";
	if (rec.reset.tries >= RESET_MAX_TRIES) return "too_many";

	if (!(await matchesHash(code.trim(), rec.reset.codeHash))) {
		// Count the failure before returning, or the limit means nothing.
		await writeAuth({ ...rec, reset: { ...rec.reset, tries: rec.reset.tries + 1 } });
		return "bad_code";
	}

	if (next.length < MIN_PASSWORD_LENGTH) return "too_short";
	if (next !== confirm) return "mismatch";

	await writeAuth({
		hash: await hashPassword(next),
		updatedAt: Date.now(),
		version: rec.version + 1,
		reset: null,
		sessionSecret: rec.sessionSecret,
	});
	await createSession();
	return null;
}

/** True while a reset code is outstanding — the login page shows the code form. */
export async function resetPending(): Promise<boolean> {
	const rec = await readAuth();
	return Boolean(rec?.reset && rec.reset.expiresAt > Date.now() && rec.reset.tries < RESET_MAX_TRIES);
}
