import type { APIRoute } from "astro";
import { createMagicLink, isValidEmail } from "../../../lib/auth";
import { sendMagicLink } from "../../../lib/email";

export const prerender = false;

const REPORT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const claimRaw = String(form.get("claim") ?? "").trim();
  const claim = REPORT_ID_RE.test(claimRaw) ? claimRaw : undefined;

  const claimQs = claim ? `&claim=${claim}` : "";

  if (!isValidEmail(email)) {
    return redirect(
      `/login?error=${encodeURIComponent("Enter a valid email address.")}${claimQs}`,
    );
  }

  try {
    const url = await createMagicLink(email, claim);
    await sendMagicLink(email, url);
  } catch (err) {
    console.error("[auth/request]", err);
    return redirect(
      `/login?error=${encodeURIComponent("Couldn't send the email. Try again in a minute.")}${claimQs}`,
    );
  }

  return redirect(
    `/login?sent=1&email=${encodeURIComponent(email)}${claimQs}`,
  );
};
