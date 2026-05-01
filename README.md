# CV Review Portal

AI-powered CV review. Upload a PDF or DOCX, get a scored breakdown across content, impact, style, ATS compatibility, and skills, plus the top three highest-leverage fixes.

Built with Astro + Tailwind + Claude (Opus 4.7).

## Setup

```sh
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:4321.

## Stack

- **Frontend:** Astro 5 + Tailwind 3
- **Parsing:** `pdf-parse` (PDF), `mammoth` (DOCX)
- **Review engine:** Claude Opus 4.7 with adaptive thinking, JSON-schema structured output, prompt caching on the rubric
- **Hosting:** Node adapter (deploy to Vercel, Render, Fly, or any Node host)

## Project structure

```
src/
  layouts/Layout.astro      base HTML shell
  pages/
    index.astro             upload UI + report rendering
    api/review.ts           POST endpoint: parse + review
  lib/
    parse.ts                PDF/DOCX text extraction
    review.ts               Claude API call + schema
  styles/global.css         Tailwind + design tokens
```

## Build

```sh
npm run build
node dist/server/entry.mjs
```
