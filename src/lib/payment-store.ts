import { Redis } from "@upstash/redis";

const url = import.meta.env.UPSTASH_REDIS_REST_URL;
const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

const TTL_SECONDS = 60 * 60 * 24 * 7;

const redis = url && token ? new Redis({ url, token }) : null;

const localFallback = new Set<string>();

if (!redis) {
  console.warn(
    "[payment-store] Upstash env vars missing — using in-memory fallback (NOT safe in serverless)",
  );
}

export async function claimPayment(paymentId: string): Promise<boolean> {
  if (redis) {
    const result = await redis.set(`pay:${paymentId}`, "used", {
      nx: true,
      ex: TTL_SECONDS,
    });
    return result === "OK";
  }
  if (localFallback.has(paymentId)) return false;
  localFallback.add(paymentId);
  return true;
}
