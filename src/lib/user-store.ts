import { redis } from "./redis";
import crypto from "node:crypto";

export type User = {
  id: string;
  email: string;
  createdAt: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const id = await redis.get<string>(`userByEmail:${normalizeEmail(email)}`);
  if (!id) return null;
  return getUser(id);
}

export async function getUser(id: string): Promise<User | null> {
  return redis.get<User>(`user:${id}`);
}

export async function findOrCreateUser(email: string): Promise<User> {
  const normalized = normalizeEmail(email);
  const existing = await findUserByEmail(normalized);
  if (existing) return existing;

  const user: User = {
    id: crypto.randomUUID(),
    email: normalized,
    createdAt: Date.now(),
  };
  await Promise.all([
    redis.set(`user:${user.id}`, user),
    redis.set(`userByEmail:${user.email}`, user.id),
  ]);
  return user;
}
