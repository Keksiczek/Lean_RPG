import { Gemini5SScore, GeminiSubmissionAnalysis } from "./geminiTypes.js";
import { buildGeminiPrompt } from "./geminiPrompt.js";
import { config } from "../config.js";
import { CircuitBreaker } from "./circuitBreaker.js";
import logger from "./logger.js";

const GEMINI_API_KEY = config.gemini.apiKey;
const circuitBreaker = new CircuitBreaker(5, 60_000);

export async function analyzeSubmissionWithGemini(input: {
  textInput: string | null;
  imageUrl: string | null;
  areaContext: string | null;
}): Promise<GeminiSubmissionAnalysis> {
  if (!circuitBreaker.canRequest()) {
    logger.warn({
      message: "gemini_circuit_open",
      failureCount: circuitBreaker.getFailureCount(),
    });
    return fallbackAnalysis("Circuit is open; returning fallback analysis");
  }

  if (!GEMINI_API_KEY) {
    logger.warn({ message: "gemini_api_key_missing" });
    return fallbackAnalysis("Gemini API key missing; using fallback analysis");
  }

  const prompt = buildGeminiPrompt({
    textInput: input.textInput,
    imageUrl: input.imageUrl,
    areaContext: input.areaContext,
  });

  // TODO: Replace the placeholder URL with the official Gemini endpoint once available.
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await callGeminiWithRetry(endpoint, prompt);
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const modelText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = parseGeminiResponse(modelText);
    circuitBreaker.recordSuccess();
    return parsed;
  } catch (error) {
    circuitBreaker.recordFailure();
    logger.error({ message: "gemini_analysis_failed", error });
    return fallbackAnalysis("Gemini call failed; using fallback analysis");
  }
}

async function callGeminiWithRetry(endpoint: string, prompt: string) {
  const maxAttempts = 3;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    try {
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

      return response;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= maxAttempts) {
        break;
      }
      const backoffMs = 2 ** (attempt - 1) * 500;
      logger.warn({
        message: "gemini_retry",
        attempt,
        backoffMs,
        error,
      });
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError ?? new Error("Unknown Gemini error");
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
    logger.warn({
      message: "gemini_parse_failed",
      error: err,
    });
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

function fallbackAnalysis(reason: string): GeminiSubmissionAnalysis {
  const defaultScore: Gemini5SScore = {
    Seiri: 50,
    Seiton: 50,
    Seiso: 50,
    Seiketsu: 50,
    Shitsuke: 50,
  };

  return {
    feedback:
      "AI feedback není dostupné. Prosím zkontrolujte vstup a zkuste to znovu."
      + (reason ? ` (${reason})` : ""),
    score5s: defaultScore,
    riskLevel: "medium",
  };
}
