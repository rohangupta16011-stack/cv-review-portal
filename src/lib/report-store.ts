import { redis } from "./redis";
import crypto from "node:crypto";
import type { Check } from "./checks";

const REPORT_TTL_SECONDS = 60 * 60 * 24 * 7;
const USER_REPORTS_LIMIT = 50;

export type Report = {
  id: string;
  userId: string | null;
  filename: string;
  format: "pdf" | "docx";
  wordCount: number;
  fileSize: number;
  cvText: string;
  overallScore: number;
  overallSummary: string;
  headline: string;
  checks: Check[];
  createdAt: number;
  paid: boolean;
};

export type NewReport = Omit<Report, "id" | "createdAt" | "paid">;

export async function createReport(input: NewReport): Promise<Report> {
  const report: Report = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    paid: false,
  };
  const writes: Promise<unknown>[] = [
    redis.set(`report:${report.id}`, report, { ex: REPORT_TTL_SECONDS }),
  ];
  if (report.userId) {
    writes.push(
      redis.zadd(`userReports:${report.userId}`, {
        score: report.createdAt,
        member: report.id,
      }),
      redis.expire(`userReports:${report.userId}`, REPORT_TTL_SECONDS),
    );
  }
  await Promise.all(writes);
  if (report.userId) {
    await redis.zremrangebyrank(
      `userReports:${report.userId}`,
      0,
      -USER_REPORTS_LIMIT - 1,
    );
  }
  return report;
}

export async function claimReport(
  reportId: string,
  userId: string,
): Promise<Report | null> {
  const report = await getReport(reportId);
  if (!report) return null;
  if (report.userId && report.userId !== userId) return null;
  if (report.userId === userId) return report;
  const updated: Report = { ...report, userId };
  await Promise.all([
    redis.set(`report:${reportId}`, updated, { ex: REPORT_TTL_SECONDS }),
    redis.zadd(`userReports:${userId}`, {
      score: updated.createdAt,
      member: reportId,
    }),
    redis.expire(`userReports:${userId}`, REPORT_TTL_SECONDS),
  ]);
  return updated;
}

export async function getReport(id: string): Promise<Report | null> {
  return redis.get<Report>(`report:${id}`);
}

export async function listUserReports(
  userId: string,
  limit = 20,
): Promise<Report[]> {
  const ids = await redis.zrange<string[]>(
    `userReports:${userId}`,
    0,
    limit - 1,
    { rev: true },
  );
  if (!ids?.length) return [];
  const reports = await Promise.all(ids.map((id) => getReport(id)));
  return reports.filter((r): r is Report => r !== null);
}

export async function deleteReport(id: string, userId: string): Promise<void> {
  await Promise.all([
    redis.del(`report:${id}`),
    redis.zrem(`userReports:${userId}`, id),
  ]);
}
