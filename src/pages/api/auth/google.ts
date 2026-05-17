import type { APIRoute } from "astro";
import { findOrCreateUser } from "../../../lib/user-store";
import { createSession } from "../../../lib/auth";
import { claimReport } from "../../../lib/report-store";

export const prerender = false;

const REPORT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type TokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  iss?: string;
};

function err(redirect: (path: string) => Response, message: string, claim: string | null) {
  const claimQs = claim ? `&claim=${claim}` : "";
  return redirect(`/login?error=${encodeURIComponent(message)}${claimQs}`);
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const credential = String(form.get("credential") ?? "").trim();
  const claimRaw = String(form.get("claim") ?? "").trim();
  const claim = REPORT_ID_RE.test(claimRaw) ? claimRaw : null;

  if (!credential) return err(redirect, "Missing Google credential.", claim);

  const expectedAud = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;
  if (!expectedAud) {
    console.error("[auth/google] PUBLIC_GOOGLE_CLIENT_ID not configured");
    return err(redirect, "Google sign-in is not configured.", claim);
  }

  let info: TokenInfo;
  try {
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
    );
    if (!resp.ok) return err(redirect, "Invalid Google credential.", claim);
    info = (await resp.json()) as TokenInfo;
  } catch (e) {
    console.error("[auth/google] tokeninfo failed", e);
    return err(redirect, "Couldn't verify Google credential.", claim);
  }

  if (info.aud !== expectedAud) {
    return err(redirect, "Credential isn't for this app.", claim);
  }
  if (info.iss !== "https://accounts.google.com" && info.iss !== "accounts.google.com") {
    return err(redirect, "Untrusted credential issuer.", claim);
  }
  const verified = info.email_verified === true || info.email_verified === "true";
  if (!verified) return err(redirect, "Google email isn't verified.", claim);

  const email = String(info.email ?? "").trim().toLowerCase();
  if (!email) return err(redirect, "Google credential is missing an email.", claim);

  try {
    const user = await findOrCreateUser(email);
    await createSession(user.id, cookies);

    if (claim) {
      const claimed = await claimReport(claim, user.id);
      if (claimed) return redirect(`/r/${claim}`);
    }
    return redirect("/");
  } catch (e) {
    console.error("[auth/google] session failed", e);
    return err(redirect, "Sign in failed. Try again.", claim);
  }
};
