import type { APIRoute } from "astro";
import { parseCV } from "../../lib/parse";
import { reviewCV } from "../../lib/review";
import { verifySignature } from "../../lib/razorpay";
import { claimPayment } from "../../lib/payment-store";

export const prerender = false;
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get("cv");
    const orderId = String(form.get("razorpay_order_id") ?? "");
    const paymentId = String(form.get("razorpay_payment_id") ?? "");
    const signature = String(form.get("razorpay_signature") ?? "");

    if (!orderId || !paymentId || !signature) {
      return json({ error: "Payment required." }, 402);
    }
    if (!verifySignature(orderId, paymentId, signature)) {
      return json({ error: "Invalid payment signature." }, 402);
    }

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

    const claimed = await claimPayment(paymentId);
    if (!claimed) {
      return json({ error: "This payment has already been used." }, 402);
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
