import type { APIRoute } from "astro";
import { consumeMagicLink, createSession } from "../../lib/auth";
import { claimReport } from "../../lib/report-store";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token = url.searchParams.get("token");
  if (!token) return redirect("/login?error=" + encodeURIComponent("Missing token."));

  const result = await consumeMagicLink(token);
  if (!result) {
    return redirect(
      "/login?error=" + encodeURIComponent("This link is expired or already used."),
    );
  }

  await createSession(result.user.id, cookies);

  if (result.claim) {
    const claimed = await claimReport(result.claim, result.user.id);
    if (claimed) return redirect(`/r/${result.claim}`);
  }
  return redirect("/");
};
