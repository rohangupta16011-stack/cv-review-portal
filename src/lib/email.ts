import { Resend } from "resend";

const apiKey = import.meta.env.RESEND_API_KEY;
const from = import.meta.env.RESEND_FROM;

const resend = apiKey ? new Resend(apiKey) : null;

export async function sendMagicLink(to: string, url: string): Promise<void> {
  if (!resend || !from) {
    if (import.meta.env.DEV) {
      console.log(`[email:dev] Magic link for ${to}: ${url}`);
      return;
    }
    throw new Error("Email service not configured.");
  }

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Your CV Review sign-in link",
    html: renderMagicLinkEmail(url),
    text: `Sign in to CV Review:\n\n${url}\n\nThis link expires in 15 minutes.`,
  });

  if (error) throw new Error(error.message ?? "Failed to send email");
}

function renderMagicLinkEmail(url: string): string {
  return `
<!doctype html>
<html>
<body style="font-family:-apple-system,system-ui,sans-serif;background:#FFFBF5;padding:32px;color:#1F2937">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(31,41,55,0.06)">
    <h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px">Sign in to CV Review</h1>
    <p style="margin:0 0 24px;color:#374151">Click the button below to sign in. The link expires in 15 minutes.</p>
    <a href="${url}" style="display:inline-block;background:#0D9488;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:500">Sign in</a>
    <p style="margin:24px 0 0;color:#6B7280;font-size:13px">If the button doesn't work, paste this into your browser:<br><span style="word-break:break-all">${url}</span></p>
  </div>
</body>
</html>`.trim();
}
