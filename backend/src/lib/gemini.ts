import dotenv from "dotenv";
import { Gemini5SScore, GeminiSubmissionAnalysis } from "./geminiTypes.js";
import { buildGeminiPrompt } from "./geminiPrompt.js";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function analyzeSubmissionWithGemini(input: {
  textInput: string | null;
  imageUrl: string | null;
  areaContext: string | null;
}): Promise<GeminiSubmissionAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const prompt = buildGeminiPrompt({
    textInput: input.textInput,
    imageUrl: input.imageUrl,
    areaContext: input.areaContext,
  });

  // TODO: Replace the placeholder URL with the official Gemini endpoint once available.
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      // TODO: Add image parts when image upload/storage is implemented.
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const modelText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseGeminiResponse(modelText);

  return parsed;
}

function parseGeminiResponse(text: string): GeminiSubmissionAnalysis {
  // Basic parsing fallback; expects the model to return a structured block.
  // If parsing fails, return conservative defaults.
  try {
    const match = /```json\n(?<json>{[\s\S]*?})\n```/m.exec(text);
    if (match?.groups?.json) {
      const json = JSON.parse(match.groups.json) as GeminiSubmissionAnalysis;
      return json;
    }
  } catch (err) {
    console.warn("Failed to parse Gemini response, using fallback", err);
  }

  const defaultScore: Gemini5SScore = {
    Seiri: 50,
    Seiton: 50,
    Seiso: 50,
    Seiketsu: 50,
    Shitsuke: 50,
  };

  return {
    feedback:
      text ||
      "AI feedback není dostupné. Prosím zkontrolujte vstup a zkuste to znovu.",
    score5s: defaultScore,
    riskLevel: "medium",
  };
}
