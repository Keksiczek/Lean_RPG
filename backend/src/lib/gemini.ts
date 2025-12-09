import { Gemini5SScore, GeminiSubmissionAnalysis } from "./geminiTypes.js";
import { buildGeminiPrompt } from "./geminiPrompt.js";
import { config } from "../config.js";
import { CircuitBreaker, CircuitState } from "./circuitBreaker.js";
import logger from "./logger.js";

const geminiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  successThreshold: 2,
});

type SubmissionInput = {
  textInput: string | null;
  imageUrl: string | null;
  areaContext: string | null;
  requestId?: string;
};

const FALLBACK_ANALYSIS: GeminiSubmissionAnalysis & { isAiGenerated?: boolean } = {
  feedback:
    "AI feedback není dostupné. Prosím zkontrolujte vstup a zkuste to znovu.",
  score5s: {
    Seiri: 50,
    Seiton: 50,
    Seiso: 50,
    Seiketsu: 50,
    Shitsuke: 50,
  },
  riskLevel: "medium",
  isAiGenerated: false,
};

export async function analyzeSubmissionWithGemini(
  input: SubmissionInput
): Promise<GeminiSubmissionAnalysis & { isAiGenerated?: boolean }> {
  const { textInput, imageUrl, areaContext, requestId } = input;

  if (!config.gemini.apiKey) {
    logger.warn("Gemini API key missing; returning fallback analysis", {
      context: "gemini",
      requestId,
    });
    return FALLBACK_ANALYSIS;
  }

  if (geminiCircuitBreaker.getState() === "OPEN") {
    logger.warn("Gemini circuit breaker is OPEN", {
      context: "gemini",
      requestId,
    });
    return FALLBACK_ANALYSIS;
  }

  const prompt = buildGeminiPrompt({ textInput, imageUrl, areaContext });
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.gemini.apiKey}`;

  for (let attempt = 0; attempt < config.gemini.maxRetries; attempt++) {
    try {
      logger.info("Calling Gemini", {
        context: "gemini",
        requestId,
        attempt,
      });

      const response = await geminiCircuitBreaker.execute(async () =>
        callGeminiAPI(endpoint, prompt, requestId)
      );

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const modelText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const parsed = parseGeminiResponse(modelText);
      logger.info("Gemini analysis succeeded", {
        context: "gemini",
        requestId,
        attempt,
      });
      return parsed;
    } catch (error) {
      const isLastAttempt = attempt === config.gemini.maxRetries - 1;
      const delay = 2 ** attempt * 1000;
      logger.warn("Gemini call failed", {
        context: "gemini",
        requestId,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      if (isLastAttempt || geminiCircuitBreaker.getState() === "OPEN") {
        logger.error("Gemini failed after retries; returning fallback", {
          context: "gemini",
          requestId,
        });
        return FALLBACK_ANALYSIS;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return FALLBACK_ANALYSIS;
}

function parseGeminiResponse(text: string): GeminiSubmissionAnalysis & {
  isAiGenerated?: boolean;
} {
  try {
    const match = /```json\n(?<json>{[\s\S]*?})\n```/m.exec(text);
    if (match?.groups?.json) {
      const json = JSON.parse(match.groups.json) as GeminiSubmissionAnalysis;
      return { ...json, isAiGenerated: true };
    }
  } catch (err) {
    logger.warn("Gemini response parsing failed", {
      context: "gemini",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return FALLBACK_ANALYSIS;
}

async function callGeminiAPI(
  endpoint: string,
  prompt: string,
  requestId?: string
) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.gemini.timeoutMs
  );

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
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${body}`);
    }

    return response;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`Gemini API timeout after ${config.gemini.timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function getGeminiCircuitState(): CircuitState {
  return geminiCircuitBreaker.getState();
}
