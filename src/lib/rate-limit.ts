import { redis } from "./redis";

const DAILY_FREE_REPORTS = 1;

function todayUtc(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function userKey(userId: string): string {
  return `quota:user:${userId}:${todayUtc()}`;
}
function ipKey(ip: string): string {
  return `quota:ip:${ip}:${todayUtc()}`;
}

export type QuotaResult = { allowed: boolean; remaining: number };

async function consume(key: string): Promise<QuotaResult> {
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60 * 60 * 25);
  if (count > DAILY_FREE_REPORTS) {
    await redis.decr(key);
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: DAILY_FREE_REPORTS - count };
}

export async function checkAndConsumeForUser(
  userId: string,
): Promise<QuotaResult> {
  return consume(userKey(userId));
}

export async function checkAndConsumeForIp(ip: string): Promise<QuotaResult> {
  return consume(ipKey(ip));
}

export async function refundForUser(userId: string): Promise<void> {
  await redis.decr(userKey(userId));
}

export async function refundForIp(ip: string): Promise<void> {
  await redis.decr(ipKey(ip));
}

export async function getRemainingForUser(userId: string): Promise<number> {
  const used = (await redis.get<number>(userKey(userId))) ?? 0;
  return Math.max(0, DAILY_FREE_REPORTS - used);
}

export async function getRemainingForIp(ip: string): Promise<number> {
  const used = (await redis.get<number>(ipKey(ip))) ?? 0;
  return Math.max(0, DAILY_FREE_REPORTS - used);
}
