import type { ParsedCV } from "./parse";

export type CheckStatus = "pass" | "warn" | "fail";
export type CheckCategory = "content" | "sections" | "ats_essentials";

export type Check = {
  id: string;
  category: CheckCategory;
  title: string;
  status: CheckStatus;
  summary: string;
  details?: string[];
  meta?: Record<string, unknown>;
};

const SECTION_PATTERNS: Array<{ key: string; label: string; re: RegExp }> = [
  { key: "experience", label: "Experience", re: /^\s*(?:work\s+)?experience\b/im },
  { key: "education", label: "Education", re: /^\s*education\b/im },
  { key: "skills", label: "Skills", re: /^\s*(?:technical\s+|key\s+)?skills\b/im },
  { key: "summary", label: "Summary", re: /^\s*(?:summary|profile|about\s+me|objective)\b/im },
];

const PHONE_RE = /(?:\+?\d[\d\s\-().]{7,}\d)/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const LINKEDIN_RE = /linkedin\.com\/in\/[A-Za-z0-9_-]+/i;
const URL_RE = /\bhttps?:\/\/\S+/i;

const COMMON_VERBS = [
  "launched", "led", "managed", "developed", "built", "created", "designed",
  "implemented", "improved", "increased", "reduced", "delivered", "drove",
  "oversaw", "coordinated", "executed", "spearheaded", "owned", "scaled",
  "optimized", "streamlined", "established", "introduced",
];

const SYNONYMS: Record<string, string[]> = {
  launched: ["initiated", "rolled out", "shipped", "released"],
  led: ["headed", "directed", "spearheaded", "drove"],
  managed: ["oversaw", "coordinated", "directed", "ran"],
  developed: ["built", "engineered", "designed", "created"],
  built: ["constructed", "engineered", "developed", "assembled"],
  created: ["designed", "built", "established", "produced"],
  designed: ["architected", "crafted", "engineered", "modeled"],
  implemented: ["deployed", "executed", "introduced", "rolled out"],
  improved: ["enhanced", "optimized", "refined", "upgraded"],
  increased: ["grew", "boosted", "expanded", "raised"],
  reduced: ["cut", "lowered", "decreased", "shrank"],
  delivered: ["shipped", "produced", "executed", "completed"],
  drove: ["led", "propelled", "fueled", "accelerated"],
  oversaw: ["supervised", "managed", "directed", "coordinated"],
  coordinated: ["organized", "orchestrated", "managed", "aligned"],
  executed: ["implemented", "delivered", "carried out", "completed"],
  spearheaded: ["led", "championed", "pioneered", "headed"],
  owned: ["led", "ran", "drove", "managed"],
  scaled: ["expanded", "grew", "extended", "broadened"],
  optimized: ["streamlined", "improved", "refined", "tuned"],
  streamlined: ["simplified", "optimized", "tightened", "refined"],
  established: ["set up", "founded", "instituted", "launched"],
  introduced: ["launched", "rolled out", "unveiled", "presented"],
};

function checkFileFormat(parsed: ParsedCV, sizeBytes: number): Check {
  const isPdf = parsed.format === "pdf";
  const sizeMb = sizeBytes / (1024 * 1024);
  if (isPdf && sizeMb < 2) {
    return {
      id: "file_format",
      category: "ats_essentials",
      title: "File format & size",
      status: "pass",
      summary: `Your file is ${formatSize(sizeBytes)} ${parsed.format.toUpperCase()} — well within ATS limits.`,
    };
  }
  if (sizeMb >= 2) {
    return {
      id: "file_format",
      category: "ats_essentials",
      title: "File format & size",
      status: "warn",
      summary: `Your ${parsed.format.toUpperCase()} is ${formatSize(sizeBytes)} — many ATS systems cap uploads at 2MB.`,
    };
  }
  return {
    id: "file_format",
    category: "ats_essentials",
    title: "File format & size",
    status: "warn",
    summary: `Your file is DOCX — most ATS systems prefer PDF for stable parsing.`,
  };
}

function checkEssentialSections(text: string): Check {
  const found: string[] = [];
  const missing: string[] = [];
  for (const s of SECTION_PATTERNS) {
    if (s.re.test(text)) found.push(s.label);
    else missing.push(s.label);
  }
  if (missing.length === 0) {
    return {
      id: "essential_sections",
      category: "sections",
      title: "Essential sections",
      status: "pass",
      summary: "All essential sections were detected.",
      details: found,
    };
  }
  return {
    id: "essential_sections",
    category: "sections",
    title: "Essential sections",
    status: missing.length >= 2 ? "fail" : "warn",
    summary: `Missing: ${missing.join(", ")}.`,
    details: found,
    meta: { found, missing },
  };
}

function checkContactInfo(text: string): Check {
  const head = text.slice(0, 1000);
  const email = head.match(EMAIL_RE)?.[0];
  const phone = head.match(PHONE_RE)?.[0]?.trim();
  const linkedin = head.match(LINKEDIN_RE)?.[0];
  const found: string[] = [];
  if (email) found.push(`Email: ${email}`);
  if (phone) found.push(`Phone: ${phone}`);
  if (linkedin) found.push(`LinkedIn: ${linkedin}`);

  if (email && phone) {
    return {
      id: "contact_info",
      category: "sections",
      title: "Contact information",
      status: "pass",
      summary: linkedin
        ? "Email, phone, and LinkedIn detected."
        : "Email and phone detected.",
      details: found,
    };
  }
  return {
    id: "contact_info",
    category: "sections",
    title: "Contact information",
    status: "warn",
    summary: !email
      ? "No email found in the top of your CV."
      : "No phone number found in the top of your CV.",
    details: found,
  };
}

function checkEmailFormat(text: string): Check {
  const email = text.slice(0, 1000).match(EMAIL_RE)?.[0];
  if (!email) {
    return {
      id: "email_format",
      category: "ats_essentials",
      title: "Email address",
      status: "warn",
      summary: "No email address detected.",
    };
  }
  const local = email.split("@")[0].toLowerCase();
  const looksUnprofessional =
    /(cool|sexy|love|crazy|killer|baby|king|queen|fan|player|gamer)/i.test(local) ||
    /\d{4,}/.test(local);
  if (looksUnprofessional) {
    return {
      id: "email_format",
      category: "ats_essentials",
      title: "Email address",
      status: "warn",
      summary: `${email} doesn't look like a professional address. Recruiters prefer firstname.lastname formats.`,
      details: [email],
    };
  }
  return {
    id: "email_format",
    category: "ats_essentials",
    title: "Email address",
    status: "pass",
    summary: "Your email looks professional.",
    details: [email],
  };
}

function checkHeaderLinks(text: string): Check {
  const head = text.slice(0, 600);
  const url = head.match(URL_RE)?.[0];
  if (url) {
    return {
      id: "header_links",
      category: "ats_essentials",
      title: "Header links",
      status: "pass",
      summary: "A full URL was detected — ATS systems can read it cleanly.",
      details: [url],
    };
  }
  return {
    id: "header_links",
    category: "ats_essentials",
    title: "Header links",
    status: "warn",
    summary: "No full URL in the header. ATS often misses links hidden behind text like \"LinkedIn profile\".",
  };
}

function checkRepetition(text: string): Check {
  const lower = text.toLowerCase();
  const offenders: Array<{ word: string; count: number; synonyms: string[] }> = [];
  for (const verb of COMMON_VERBS) {
    const re = new RegExp(`\\b${verb}\\b`, "gi");
    const count = (lower.match(re) ?? []).length;
    if (count >= 3) {
      offenders.push({
        word: verb,
        count,
        synonyms: SYNONYMS[verb] ?? [],
      });
    }
  }
  if (offenders.length === 0) {
    return {
      id: "repetition",
      category: "content",
      title: "Repetition",
      status: "pass",
      summary: "No action verb is overused.",
    };
  }
  offenders.sort((a, b) => b.count - a.count);
  return {
    id: "repetition",
    category: "content",
    title: "Repetition",
    status: "warn",
    summary: `${offenders.length} word${offenders.length > 1 ? "s" : ""} repeated 3+ times — try synonyms to vary your impact verbs.`,
    details: offenders.map((o) => `"${o.word}" used ${o.count}× — try ${o.synonyms.slice(0, 3).join(", ")}`),
    meta: { offenders },
  };
}

const COMMON_TYPOS: Record<string, string> = {
  accomodate: "accommodate", acheive: "achieve", acheived: "achieved",
  achievment: "achievement", acording: "according", acomplish: "accomplish",
  aquired: "acquired", beggining: "beginning", begining: "beginning",
  benefical: "beneficial", calender: "calendar", catagory: "category",
  collaberate: "collaborate", collegue: "colleague", comming: "coming",
  commited: "committed", completly: "completely", concieve: "conceive",
  consistant: "consistent", definately: "definitely", dependant: "dependent",
  developement: "development", embarass: "embarrass", enviroment: "environment",
  existance: "existence", experiance: "experience", familar: "familiar",
  finaly: "finally", fullfill: "fulfill", functionallity: "functionality",
  goverment: "government", harrass: "harass", hierachy: "hierarchy",
  independant: "independent", knowlege: "knowledge", leadeship: "leadership",
  liason: "liaison", managment: "management", neccessary: "necessary",
  noticable: "noticeable", occassion: "occasion", occured: "occurred",
  occurence: "occurrence", peformance: "performance", percieve: "perceive",
  pernament: "permanent", posession: "possession", preceeding: "preceding",
  priviledge: "privilege", proffesional: "professional", recieve: "receive",
  recieved: "received", recomend: "recommend", recomendation: "recommendation",
  refered: "referred", referance: "reference", refering: "referring",
  responsability: "responsibility", responsable: "responsible", rythm: "rhythm",
  sceduled: "scheduled", seperate: "separate", seperated: "separated",
  succesful: "successful", succesfully: "successfully", succesion: "succession",
  suprise: "surprise", targetted: "targeted", througout: "throughout",
  thier: "their", tommorrow: "tomorrow", truely: "truly", untill: "until",
  wich: "which", wierd: "weird", writting: "writing",
};

const QUANTIFY_RE =
  /\d|%|\$|₹|€|£|\bmillion\b|\bthousand\b|\bbillion\b|\bM\b|\bK\b|\bx\b|doubled|tripled|halved/i;

function checkAtsParseRate(parsed: ParsedCV): Check {
  const wc = parsed.wordCount;
  const text = parsed.text;
  const sectionsFound = SECTION_PATTERNS.filter((s) => s.re.test(text)).length;
  const weirdChars = (text.match(/[^\x00-\x7F -ÿ₹€£•·–—'']/g) ?? []).length;
  const weirdRatio = weirdChars / Math.max(text.length, 1);
  const avgLineLen =
    text.length / Math.max(text.split("\n").filter((l) => l.trim().length > 0).length, 1);

  let score = 100;
  if (wc < 100) score -= 30;
  else if (wc < 200) score -= 15;
  if (sectionsFound < 2) score -= 20;
  if (sectionsFound < 3) score -= 5;
  if (weirdRatio > 0.05) score -= 20;
  if (avgLineLen > 200) score -= 15;
  score = Math.max(0, Math.min(100, score));

  let status: CheckStatus;
  let summary: string;
  if (score >= 80) {
    status = "pass";
    summary = `${score}% parse rate — your CV reads cleanly through a typical ATS.`;
  } else if (score >= 60) {
    status = "warn";
    summary = `${score}% parse rate — some structural cues may confuse strict ATS systems.`;
  } else {
    status = "fail";
    summary = `${score}% parse rate — the CV format may significantly hurt ATS visibility.`;
  }
  return {
    id: "ats_parse_rate",
    category: "content",
    title: "ATS parse rate",
    status,
    summary,
    meta: { score },
  };
}

function checkQuantifyingImpact(text: string): Check {
  const lines = text.split("\n").map((l) => l.trim());
  const bullets = lines.filter(
    (l) =>
      l.length >= 25 &&
      l.length <= 320 &&
      (/^[-•*▪◦‣»·]/.test(l) ||
        /^[A-Z][a-z]+(?:ed|ing|s)?\s+/.test(l)),
  );

  if (bullets.length < 3) {
    return {
      id: "quantifying_impact",
      category: "content",
      title: "Quantifying impact",
      status: "warn",
      summary: "Few experience bullets detected — review your formatting.",
    };
  }

  const weak = bullets.filter((b) => !QUANTIFY_RE.test(b));
  const ratio = weak.length / bullets.length;

  let status: CheckStatus;
  let summary: string;
  if (ratio < 0.2) {
    status = "pass";
    summary = `${bullets.length - weak.length} of ${bullets.length} bullets quantify their impact — strong work.`;
  } else if (ratio < 0.5) {
    status = "warn";
    summary = `${weak.length} of ${bullets.length} bullets lack measurable outcomes (numbers, percentages, scale).`;
  } else {
    status = "fail";
    summary = `${weak.length} of ${bullets.length} bullets lack measurable outcomes — recruiters skim past these.`;
  }
  return {
    id: "quantifying_impact",
    category: "content",
    title: "Quantifying impact",
    status,
    summary,
    details: weak.slice(0, 6),
  };
}

function checkSpelling(text: string): Check {
  const tokens = text.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const seen = new Set<string>();
  const found: Array<{ wrong: string; right: string }> = [];
  for (const t of tokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    if (COMMON_TYPOS[t]) {
      found.push({ wrong: t, right: COMMON_TYPOS[t] });
    }
  }
  if (found.length === 0) {
    return {
      id: "spelling_grammar",
      category: "content",
      title: "Spelling & grammar",
      status: "pass",
      summary: "No common spelling errors detected.",
    };
  }
  return {
    id: "spelling_grammar",
    category: "content",
    title: "Spelling & grammar",
    status: found.length >= 4 ? "fail" : "warn",
    summary: `${found.length} likely spelling ${found.length === 1 ? "issue" : "issues"} detected.`,
    details: found.map((f) => `"${f.wrong}" → ${f.right}`),
    meta: { issue_count: found.length },
  };
}

export function runDeterministicChecks(
  parsed: ParsedCV,
  sizeBytes: number,
): Check[] {
  return [
    checkAtsParseRate(parsed),
    checkQuantifyingImpact(parsed.text),
    checkRepetition(parsed.text),
    checkSpelling(parsed.text),
    checkEssentialSections(parsed.text),
    checkContactInfo(parsed.text),
    checkFileFormat(parsed, sizeBytes),
    checkEmailFormat(parsed.text),
    checkHeaderLinks(parsed.text),
  ];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
