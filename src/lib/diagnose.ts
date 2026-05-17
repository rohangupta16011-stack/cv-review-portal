import Anthropic from "@anthropic-ai/sdk";
import type { Check } from "./checks";

const client = new Anthropic({ apiKey: import.meta.env.ANTHROPIC_API_KEY });

export type Prose = {
  headline: string;
  overall_summary: string;
};

const PROSE_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    overall_summary: { type: "string" },
  },
  required: ["headline", "overall_summary"],
  additionalProperties: false,
};

export type ProseInput = {
  overallScore: number;
  totalIssues: number;
  categoryScores: Record<string, number>;
  topFindings: string[];
  cvSnippet: string;
};

export async function synthesizeProse(input: ProseInput): Promise<Prose> {
  const findingsBlock = input.topFindings.length
    ? `Top findings:\n${input.topFindings.map((f) => `- ${f}`).join("\n")}`
    : "No significant issues found.";

  const userMsg = `You are summarising a CV diagnosis that's already been computed by deterministic checks. Write a one-sentence headline (max 12 words, no clichés) capturing the CV's character, then a 2-sentence overall summary that names the strongest area and the area to focus on first.

Score: ${input.overallScore}/100
Total issues: ${input.totalIssues}
Category scores: ${Object.entries(input.categoryScores).map(([k, v]) => `${k}=${v}`).join(", ")}

${findingsBlock}

CV opening (first 400 chars):
${input.cvSnippet}

Return JSON only.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    output_config: {
      format: { type: "json_schema", schema: PROSE_SCHEMA },
    },
    system:
      "You are a senior career coach summarising a CV diagnosis. Be honest, specific, and concise. Avoid generic phrases like 'great candidate' or 'strong professional'. Reference the actual findings.",
    messages: [{ role: "user", content: userMsg }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from model");
  }
  return JSON.parse(textBlock.text) as Prose;
}

export function fallbackProse(input: ProseInput): Prose {
  const sortedCats = Object.entries(input.categoryScores).sort(
    (a, b) => a[1] - b[1],
  );
  const worst = sortedCats[0]?.[0] ?? "content";
  const best = sortedCats[sortedCats.length - 1]?.[0] ?? "content";
  const worstLabel = friendly(worst);
  const bestLabel = friendly(best);

  if (input.overallScore >= 80) {
    return {
      headline: `Strong CV — ${input.totalIssues === 0 ? "no issues to address" : `${input.totalIssues} polish ${input.totalIssues === 1 ? "item" : "items"}`}`,
      overall_summary: `Your CV scores ${input.overallScore}/100 — well above average. ${input.totalIssues > 0 ? `Quick wins are available in ${worstLabel}.` : `Format and content are both solid.`}`,
    };
  }
  if (input.overallScore >= 60) {
    return {
      headline: `Solid foundation with ${input.totalIssues} concrete improvements`,
      overall_summary: `Your CV scores ${input.overallScore}/100. ${bestLabel} is the strongest area; focus first on ${worstLabel}, where most of the issues surfaced.`,
    };
  }
  return {
    headline: `CV needs work, especially in ${worstLabel}`,
    overall_summary: `Your CV scores ${input.overallScore}/100. There are ${input.totalIssues} issues to address — start with ${worstLabel}, then tighten the rest.`,
  };
}

function friendly(key: string): string {
  if (key === "content") return "content";
  if (key === "sections") return "sections";
  if (key === "ats_essentials") return "ATS essentials";
  return key;
}

export async function getProse(input: ProseInput): Promise<Prose> {
  try {
    return await synthesizeProse(input);
  } catch (err) {
    console.warn("[synthesize] LLM failed, using templated prose:", err instanceof Error ? err.message : err);
    return fallbackProse(input);
  }
}

export function buildProseInput(opts: {
  cvText: string;
  checks: Check[];
  overallScore: number;
  categoryScores: Record<string, number>;
}): ProseInput {
  const issues = opts.checks.filter((c) => c.status !== "pass");
  const topFindings = issues
    .slice(0, 5)
    .map((c) => `${c.title} (${c.status}): ${c.summary}`);
  return {
    overallScore: opts.overallScore,
    totalIssues: issues.length,
    categoryScores: opts.categoryScores,
    topFindings,
    cvSnippet: opts.cvText.slice(0, 400),
  };
}
