import { Redis } from "@upstash/redis";

const url = import.meta.env.UPSTASH_REDIS_REST_URL;
const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing — required for auth, sessions, and reports.",
  );
}

export const redis = new Redis({ url, token });
