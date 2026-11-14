import { GoogleGenAI } from "@google/genai";

interface CoverLetterInput {
  studentName: string;
  jobTitle: string;
  jobDescription: string;
  category: string;
  notes?: string;
}

// Used when no GEMINI_API_KEY is set (or every AI attempt fails), so the feature still works in a demo.
const fallbackLetter = (input: CoverLetterInput): string =>
  `Dear Hiring Manager,

I am writing to apply for the "${input.jobTitle}" position. I am a motivated student with a strong interest in ${input.category.toLowerCase()} work, and I am confident I can deliver quality results on time.
${input.notes ? `\n${input.notes}\n` : ""}
I would welcome the chance to discuss how I can help with this project. Thank you for your time and consideration.

Kind regards,
${input.studentName}`;

// Models are tried in this order. GEMINI_MODEL (if set) is tried first.
// Google retires models over time, so having a few backups keeps the feature working.
const BACKUP_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash"];

// Stop trying after this many milliseconds so the request never hangs for too long.
const MAX_TOTAL_MS = 25000;

// Temporary Google errors (too busy / rate limit / server error) are worth retrying once.
const RETRYABLE_STATUSES = [429, 500, 503];

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const getStatus = (error: unknown): number | undefined => {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
};

const getModelList = (): string[] => {
  const custom = process.env.GEMINI_MODEL?.trim();
  const list = custom ? [custom, ...BACKUP_MODELS] : BACKUP_MODELS;
  return [...new Set(list)];
};

export const generateCoverLetter = async (
  input: CoverLetterInput
): Promise<{ text: string; source: "ai" | "template" }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { text: fallbackLetter(input), source: "template" };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Write a short, professional cover letter (maximum 150 words, plain text, no markdown, no placeholders like [Name]) for a university student applying to this freelance job.

Student name: ${input.studentName}
Job title: ${input.jobTitle}
Category: ${input.category}
Job description: ${input.jobDescription}
Extra notes from the student (skills/experience): ${input.notes ?? "none"}

Start with "Dear Hiring Manager," and end with "Kind regards," followed by the student's name.`;

  const startedAt = Date.now();

  for (const model of getModelList()) {
    // two attempts per model: the second one only happens after a temporary error
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (Date.now() - startedAt > MAX_TOTAL_MS) {
        console.error("AI cover letter: time limit reached, using template");
        return { text: fallbackLetter(input), source: "template" };
      }

      try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        const text = response.text?.trim();
        if (text) {
          return { text, source: "ai" };
        }
        break; // empty answer: move on to the next model
      } catch (error) {
        const status = getStatus(error);
        console.error(`AI cover letter failed (model ${model}, attempt ${attempt}, status ${status ?? "unknown"}):`, error);

        if (status !== undefined && RETRYABLE_STATUSES.includes(status) && attempt === 1) {
          await sleep(1500);
          continue; // try the same model once more
        }
        break; // otherwise move on to the next model
      }
    }
  }

  return { text: fallbackLetter(input), source: "template" };
};
