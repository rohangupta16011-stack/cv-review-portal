import Razorpay from "razorpay";
import crypto from "node:crypto";

export const PRICE_PAISE = 9900;
export const CURRENCY = "INR";

const keyId = import.meta.env.RAZORPAY_KEY_ID;
const keySecret = import.meta.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn("[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing");
}

export const razorpay = new Razorpay({
  key_id: keyId ?? "",
  key_secret: keySecret ?? "",
});

export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!keySecret) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex"),
  );
}
