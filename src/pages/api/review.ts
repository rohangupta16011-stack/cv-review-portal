import type { APIRoute } from "astro";
import { parseCV } from "../../lib/parse";
import { reviewCV } from "../../lib/review";

export const prerender = false;

const MAX_BYTES = 10 * 1024 * 1024;

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get("cv");

    if (!(file instanceof File)) {
      return json({ error: "No file uploaded." }, 400);
    }
    if (file.size > MAX_BYTES) {
      return json({ error: "File too large (max 10MB)." }, 400);
    }

    const parsed = await parseCV(file);

    if (parsed.wordCount < 50) {
      return json(
        { error: "CV looks too short or unreadable. Try a different file." },
        400,
      );
    }

    const review = await reviewCV(parsed.text);

    return json({
      filename: parsed.filename,
      format: parsed.format,
      wordCount: parsed.wordCount,
      review,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return json({ error: message }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
