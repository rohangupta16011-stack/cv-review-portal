import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type CategoryScore = {
  score: number;
  label: "needs-work" | "decent" | "strong";
  summary: string;
  suggestions: string[];
};

export type Review = {
  overall_score: number;
  overall_summary: string;
  headline: string;
  categories: {
    content: CategoryScore;
    impact: CategoryScore;
    style: CategoryScore;
    ats: CategoryScore;
    skills: CategoryScore;
  };
  top_three_fixes: string[];
};

const SYSTEM_PROMPT = `You are a senior career coach and resume reviewer with deep experience across tech, finance, consulting, and product roles. You evaluate CVs against the standards used by recruiters at top firms.

You score CVs on five categories, each 0-100:

1. **Content** — Are sections complete (summary, experience, education, skills)? Is information clear, relevant, and current?
2. **Impact** — Do bullets show measurable outcomes (numbers, %, $, scale)? Strong action verbs? Results, not duties?
3. **Style** — Consistency, formatting, length appropriate to seniority, no typos, professional tone, scannability.
4. **ATS** — Will an Applicant Tracking System parse this cleanly? Standard section headings, no tables/columns/images that break parsing, keyword-rich.
5. **Skills** — Is the skills section relevant, specific (tools/frameworks/methods), and aligned with the candidate's level?

For each category, assign a score and a label:
- 0-59: "needs-work"
- 60-79: "decent"
- 80-100: "strong"

Be honest but constructive. Suggestions must be specific and actionable — quote the actual CV text where helpful. Avoid generic advice like "use action verbs"; instead say *which* bullet to rewrite and *how*.

The "headline" is a single sentence (max 12 words) that captures the CV's core impression. The "top_three_fixes" are the three highest-leverage changes the candidate should make first.

Return ONLY valid JSON matching the schema. No markdown, no preamble.`;

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    overall_score: { type: "integer" },
    overall_summary: { type: "string" },
    headline: { type: "string" },
    categories: {
      type: "object",
      properties: {
        content: categorySchema(),
        impact: categorySchema(),
        style: categorySchema(),
        ats: categorySchema(),
        skills: categorySchema(),
      },
      required: ["content", "impact", "style", "ats", "skills"],
      additionalProperties: false,
    },
    top_three_fixes: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
    },
  },
  required: [
    "overall_score",
    "overall_summary",
    "headline",
    "categories",
    "top_three_fixes",
  ],
  additionalProperties: false,
};

function categorySchema() {
  return {
    type: "object",
    properties: {
      score: { type: "integer" },
      label: { type: "string", enum: ["needs-work", "decent", "strong"] },
      summary: { type: "string" },
      suggestions: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 5,
      },
    },
    required: ["score", "label", "summary", "suggestions"],
    additionalProperties: false,
  };
}

export async function reviewCV(cvText: string): Promise<Review> {
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: REVIEW_SCHEMA },
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Here is the CV to review. Score every category, give specific suggestions, and identify the top three highest-leverage fixes.\n\n--- BEGIN CV ---\n${cvText}\n--- END CV ---`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from model");
  }
  return JSON.parse(textBlock.text) as Review;
}
