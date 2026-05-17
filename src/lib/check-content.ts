export type CheckContent = {
  description: string;
  badHeadline: string;
  goodHeadline: string;
  ctaTitle: string;
  ctaBlurb: string;
};

const CONTENT: Record<string, CheckContent> = {
  ats_parse_rate: {
    description:
      "An Applicant Tracking System (ATS) is what employers and recruiters use to scan large piles of resumes. A high parse rate ensures the ATS can actually read your resume and skills — which is what gets you in front of a recruiter.",
    badHeadline: "Oh, no!",
    goodHeadline: "Good job!",
    ctaTitle: "Build an ATS-friendly resume",
    ctaBlurb: "Use a template designed for clean parsing across every major ATS.",
  },
  quantifying_impact: {
    description:
      "Any good resume shows the impact you've had in previous roles. Quantifying outcomes — with numbers, percentages, scale, or time saved — is what gets recruiters to pick up the phone and invite you to interview.",
    badHeadline: "Oh, no!",
    goodHeadline: "Strong impact",
    ctaTitle: "Rewrite weak bullets",
    ctaBlurb: "Get specific before/after rewrites tailored to your actual experience.",
  },
  repetition: {
    description:
      "Using the same words over and over can read as a sign of poor language range. Vary your verbs and active phrasing so each bullet lands.",
    badHeadline: "Heads up",
    goodHeadline: "Looking varied",
    ctaTitle: "Job-winning resume in minutes",
    ctaBlurb: "Get help replacing repeated verbs with stronger alternatives.",
  },
  spelling_grammar: {
    description:
      "An error-free resume is key to a strong first impression. Use a real-time content checker so typos don't reach the hiring manager.",
    badHeadline: "Oh, no!",
    goodHeadline: "Looking clean",
    ctaTitle: "Fix my spelling & grammar",
    ctaBlurb: "Get every typo flagged and corrected in one pass.",
  },
  essential_sections: {
    description:
      "Recruiters and ATS systems look for a few essential sections — Experience, Education, and a brief summary. Make sure each one is present and clearly labelled.",
    badHeadline: "Heads up",
    goodHeadline: "All present",
    ctaTitle: "Job-winning resume in minutes",
    ctaBlurb: "Use a template that places every essential section correctly.",
  },
  contact_info: {
    description:
      "Recruiters need to reach you. Include at minimum an email address; phone and a LinkedIn URL are strongly recommended.",
    badHeadline: "Heads up",
    goodHeadline: "Reachable",
    ctaTitle: "Job-winning resume in minutes",
    ctaBlurb: "Make sure your header is parser-friendly and complete.",
  },
  file_format: {
    description:
      "When uploading on Indeed, LinkedIn, or any major job board, file size matters. Aim for under 2MB. PDF is preferred — ATS systems extract text from PDFs more reliably than DOCX, PNG, or JPG.",
    badHeadline: "Heads up",
    goodHeadline: "Good job!",
    ctaTitle: "Job-winning resume in minutes",
    ctaBlurb: "Export a tight, parser-friendly PDF in one click.",
  },
  email_format: {
    description:
      "Emails are one of the main ways recruiters reach out, especially for remote and international roles. Use a professional-looking address — your name, not a nickname.",
    badHeadline: "Heads up",
    goodHeadline: "Looks professional",
    ctaTitle: "Job-winning resume in minutes",
    ctaBlurb: "Refresh your contact line in seconds.",
  },
  header_links: {
    description:
      "Applicant Tracking Systems often miss hyperlinks hidden behind text like \"LinkedIn profile\". Include the full visible URL (e.g. linkedin.com/in/yourname) so both ATS and recruiters can reach it.",
    badHeadline: "Heads up",
    goodHeadline: "Full link detected",
    ctaTitle: "Job-winning resume in minutes",
    ctaBlurb: "Include every link in a parser-friendly format.",
  },
};

export function getCheckContent(id: string): CheckContent {
  return (
    CONTENT[id] ?? {
      description: "",
      badHeadline: "Heads up",
      goodHeadline: "Looking good",
      ctaTitle: "Unlock the fix",
      ctaBlurb: "Get tailored guidance on this issue.",
    }
  );
}
