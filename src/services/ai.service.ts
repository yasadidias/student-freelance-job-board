import { GoogleGenAI } from "@google/genai";

interface CoverLetterInput {
  studentName: string;
  jobTitle: string;
  jobDescription: string;
  category: string;
  notes?: string;
}

// Used when no GEMINI_API_KEY is set (or the AI call fails), so the feature still works in a demo.
const fallbackLetter = (input: CoverLetterInput): string =>
  `Dear Hiring Manager,

I am writing to apply for the "${input.jobTitle}" position. I am a motivated student with a strong interest in ${input.category.toLowerCase()} work, and I am confident I can deliver quality results on time.
${input.notes ? `\n${input.notes}\n` : ""}
I would welcome the chance to discuss how I can help with this project. Thank you for your time and consideration.

Kind regards,
${input.studentName}`;

export const generateCoverLetter = async (
  input: CoverLetterInput
): Promise<{ text: string; source: "ai" | "template" }> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { text: fallbackLetter(input), source: "template" };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Write a short, professional cover letter (maximum 150 words, plain text, no markdown, no placeholders like [Name]) for a university student applying to this freelance job.

Student name: ${input.studentName}
Job title: ${input.jobTitle}
Category: ${input.category}
Job description: ${input.jobDescription}
Extra notes from the student (skills/experience): ${input.notes ?? "none"}

Start with "Dear Hiring Manager," and end with "Kind regards," followed by the student's name.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text?.trim();
    if (!text) {
      return { text: fallbackLetter(input), source: "template" };
    }
    return { text, source: "ai" };
  } catch (error) {
    console.error("AI cover letter failed, using template:", error);
    return { text: fallbackLetter(input), source: "template" };
  }
};