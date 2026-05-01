import type { APIRoute } from "astro";
import { razorpay, PRICE_PAISE, CURRENCY } from "../../lib/razorpay";

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const order = await razorpay.orders.create({
      amount: PRICE_PAISE,
      currency: CURRENCY,
      receipt: `cv_${Date.now()}`,
    });
    return json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: import.meta.env.PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[api/order]", err);
    return json({ error: "Could not start payment. Please try again." }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
