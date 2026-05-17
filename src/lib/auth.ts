import crypto from "node:crypto";
import type { AstroCookies } from "astro";
import { redis } from "./redis";
import { findOrCreateUser, getUser, type User } from "./user-store";

const SESSION_COOKIE = "cvr_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAGIC_TTL_SECONDS = 60 * 15;

function token(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function createMagicLink(
  email: string,
  claim?: string,
): Promise<string> {
  const t = token();
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    claim: claim ?? null,
  });
  await redis.set(`magic:${t}`, payload, { ex: MAGIC_TTL_SECONDS });
  const base = import.meta.env.APP_URL?.replace(/\/$/, "") ?? "";
  return `${base}/auth/verify?token=${t}`;
}

export type MagicResult = { user: User; claim: string | null };

export async function consumeMagicLink(t: string): Promise<MagicResult | null> {
  const raw = await redis.get<string | { email: string; claim: string | null }>(
    `magic:${t}`,
  );
  if (!raw) return null;
  await redis.del(`magic:${t}`);
  const parsed: { email: string; claim: string | null } =
    typeof raw === "string" ? JSON.parse(raw) : raw;
  const user = await findOrCreateUser(parsed.email);
  return { user, claim: parsed.claim };
}

export async function createSession(
  userId: string,
  cookies: AstroCookies,
): Promise<void> {
  const t = token();
  await redis.set(`session:${t}`, userId, { ex: SESSION_TTL_SECONDS });
  cookies.set(SESSION_COOKIE, t, {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const t = cookies.get(SESSION_COOKIE)?.value;
  if (t) await redis.del(`session:${t}`);
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export async function getSessionUser(
  cookies: AstroCookies,
): Promise<User | null> {
  const t = cookies.get(SESSION_COOKIE)?.value;
  if (!t) return null;
  const userId = await redis.get<string>(`session:${t}`);
  if (!userId) return null;
  return getUser(userId);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
