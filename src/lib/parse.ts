import mammoth from "mammoth";

export type ParsedCV = {
  text: string;
  filename: string;
  format: "pdf" | "docx";
  wordCount: number;
};

export async function parseCV(file: File): Promise<ParsedCV> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name;
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const { default: pdfParse } = await import("pdf-parse");
    const data = await pdfParse(buffer);
    const text = normalize(data.text);
    return { text, filename, format: "pdf", wordCount: countWords(text) };
  }

  if (lower.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    const text = normalize(value);
    return { text, filename, format: "docx", wordCount: countWords(text) };
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX.");
}

function normalize(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}
