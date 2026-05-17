import type { APIRoute } from "astro";
import { parseCV } from "../../lib/parse";
import { runDeterministicChecks, type Check, type CheckStatus } from "../../lib/checks";
import { buildProseInput, getProse } from "../../lib/diagnose";
import { createReport } from "../../lib/report-store";
import {
  checkAndConsumeForUser,
  checkAndConsumeForIp,
  refundForUser,
  refundForIp,
} from "../../lib/rate-limit";

export const prerender = false;
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const STATUS_SCORE: Record<CheckStatus, number> = { pass: 100, warn: 65, fail: 30 };

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function categoryScore(checks: Check[]): number {
  if (checks.length === 0) return 0;
  return Math.round(
    checks.reduce((acc, c) => acc + STATUS_SCORE[c.status], 0) / checks.length,
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  const ip = clientIp(request);
  const refundQuota = () =>
    user ? refundForUser(user.id) : refundForIp(ip);
  let consumedQuota = false;
  try {
    const form = await request.formData();
    const file = form.get("cv");
    if (!(file instanceof File)) {
      return json({ error: "No file uploaded." }, 400);
    }
    if (file.size > MAX_BYTES) {
      return json({ error: "File too large (max 10MB)." }, 400);
    }

    let parsed;
    try {
      parsed = await parseCV(file);
    } catch (err) {
      return json(
        { error: err instanceof Error ? err.message : "Couldn't read that file." },
        400,
      );
    }
    if (parsed.wordCount < 50) {
      return json(
        { error: "CV looks too short or unreadable. Try a different file." },
        400,
      );
    }

    const quota = user
      ? await checkAndConsumeForUser(user.id)
      : await checkAndConsumeForIp(ip);
    if (!quota.allowed) {
      return json(
        {
          error: user
            ? "You've used your free review for today. Come back tomorrow."
            : "Daily free review limit reached from your network. Sign in or try tomorrow.",
        },
        429,
      );
    }
    consumedQuota = true;

    const checks = runDeterministicChecks(parsed, file.size);

    const categoryScores = {
      content: categoryScore(checks.filter((c) => c.category === "content")),
      sections: categoryScore(checks.filter((c) => c.category === "sections")),
      ats_essentials: categoryScore(
        checks.filter((c) => c.category === "ats_essentials"),
      ),
    };
    const overallScore = Math.round(
      (categoryScores.content +
        categoryScores.sections +
        categoryScores.ats_essentials) /
        3,
    );

    const prose = await getProse(
      buildProseInput({
        cvText: parsed.text,
        checks,
        overallScore,
        categoryScores,
      }),
    );

    const report = await createReport({
      userId: user ? user.id : null,
      filename: parsed.filename,
      format: parsed.format,
      wordCount: parsed.wordCount,
      fileSize: file.size,
      cvText: parsed.text,
      overallScore,
      overallSummary: prose.overall_summary,
      headline: prose.headline,
      checks,
    });

    return json({ id: report.id });
  } catch (err) {
    console.error("[api/report]", err);
    if (consumedQuota) await refundQuota().catch(() => {});
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
