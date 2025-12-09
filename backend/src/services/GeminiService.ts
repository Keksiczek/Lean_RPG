import axios, { AxiosError } from "axios";
import pRetry from "p-retry";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { CircuitBreaker } from "../lib/circuitBreaker.js";
import { calculateXpGainForSubmission } from "../lib/xp.js";
import { buildGeminiPrompt } from "../lib/geminiPrompt.js";
import { config } from "../config.js";

export type GeminiAnalysis = {
  feedback: string;
  score5s: {
    Seiri: number;
    Seiton: number;
    Seiso: number;
    Seiketsu: number;
    Shitsuke: number;
  };
  riskLevel: "low" | "medium" | "high";
  isAiGenerated: boolean;
};

export function getFallbackAnalysis(): GeminiAnalysis {
  return {
    feedback:
      "AI analýza není momentálně dostupná. " +
      "Vaše řešení bylo uloženo a bude zpracováno později. " +
      "Pokud chyba přetrvává, kontaktujte podporu.",
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
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;

export class GeminiService {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.gemini.circuitBreaker.failureThreshold,
      resetTimeout: config.gemini.circuitBreaker.resetTimeout,
    });
  }

  public async processSubmission(data: { submissionId: number; requestId?: string }) {
    const { submissionId, requestId } = data;
    const startTime = Date.now();

    const submission = await (prisma as any).submission.findUnique({
      where: { id: submissionId },
      include: {
        quest: true,
        userQuest: true,
        workstation: { include: { area: { include: { knowledgePacks: true } } } },
      },
    });

    if (!submission) {
      logger.error({
        message: "submission_not_found",
        submissionId,
        requestId,
      });
      throw new Error(`Submission #${submissionId} not found`);
    }

    logger.info({
      message: "gemini_analysis_started",
      submissionId,
      requestId,
      circuitBreakerState: this.circuitBreaker.getState(),
    });

    try {
      const analysis = await this.analyzeWithResilience(submission, requestId);

      const xpGain = calculateXpGainForSubmission({
        baseXp: submission.quest.baseXp,
        score5s: analysis.score5s,
        riskLevel: analysis.riskLevel,
      });

      await (prisma as any).$transaction(async (tx: any) => {
        await tx.submission.update({
          where: { id: submission.id },
          data: {
            aiFeedback: analysis.feedback,
            aiScore5s: JSON.stringify(analysis.score5s),
            aiRiskLevel: analysis.riskLevel,
            xpGain,
            status: "evaluated",
          },
        });

        if (submission.userQuest) {
          await tx.userQuest.update({
            where: { id: submission.userQuest.id },
            data: { status: "evaluated" },
          });
        }

        await tx.xpLog.create({
          data: {
            userId: submission.userId,
            source: "submission",
            xpChange: xpGain,
            note: `Quest ${submission.quest.title} submission evaluated`,
          },
        });

        await tx.user.update({
          where: { id: submission.userId },
          data: { totalXp: { increment: xpGain } },
        });
      });

      const duration = Date.now() - startTime;
      logger.info({
        message: "gemini_analysis_completed",
        submissionId,
        requestId,
        duration_ms: duration,
        xpGain,
        isAiGenerated: analysis.isAiGenerated,
      });

      this.circuitBreaker.recordSuccess();
    } catch (error) {
      await this.handleAnalysisFailure(submission, requestId, error);
      this.circuitBreaker.recordFailure();
    }
  }

  private async analyzeWithResilience(submission: any, requestId?: string): Promise<GeminiAnalysis> {
    if (!this.circuitBreaker.isAvailable()) {
      const state = this.circuitBreaker.getState();
      logger.warn({
        message: "circuit_breaker_open_fallback",
        submissionId: submission.id,
        requestId,
        circuitBreakerState: state.state,
        failureCount: state.failureCount,
      });
      return getFallbackAnalysis();
    }

    try {
      const analysis = await pRetry(
        async () => this.callGeminiWithTimeout(submission, requestId),
        {
          retries: config.gemini.maxRetries ?? DEFAULT_MAX_RETRIES,
          minTimeout: 1_000,
          maxTimeout: 4_000,
          factor: 2,
          onFailedAttempt: (retryError) => {
            logger.warn({
              message: "gemini_request_retry",
              submissionId: submission.id,
              requestId,
              attempt: retryError.attemptNumber,
              retriesLeft: retryError.retriesLeft,
              error: retryError.message,
            });
          },
        }
      );

      return { ...analysis, isAiGenerated: true };
    } catch (error) {
      logger.error({
        message: "gemini_retry_exhausted",
        submissionId: submission.id,
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return getFallbackAnalysis();
    }
  }

  private async callGeminiWithTimeout(submission: any, requestId?: string): Promise<GeminiAnalysis> {
    const timeoutMs = config.gemini.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (!config.gemini.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = this.buildPrompt(submission);

    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          params: { key: config.gemini.apiKey },
          timeout: timeoutMs,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": requestId || "unknown",
          },
        }
      );

      return this.parseGeminiResponse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === "ECONNABORTED") {
          throw new Error(`Gemini request timeout (${timeoutMs}ms)`);
        }
        if (axiosError.response?.status === 429) {
          throw new Error("Gemini rate limit exceeded");
        }
        if (axiosError.response?.status === 503) {
          throw new Error("Gemini service temporarily unavailable");
        }
      }

      throw error;
    }
  }

  private buildPrompt(submission: any) {
    const areaContext = submission.workstation
      ? submission.workstation.area?.knowledgePacks?.[0]?.content ?? null
      : null;

    const basePrompt = buildGeminiPrompt({
      textInput: submission.textInput ?? submission.content ?? null,
      imageUrl: submission.imageUrl ?? null,
      areaContext,
    });

    return [
      `QUEST: ${submission.quest.title}`,
      `DESCRIPTION: ${submission.quest.description}`,
      basePrompt,
    ].join("\n\n");
  }

  private parseGeminiResponse(data: any): GeminiAnalysis {
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("Gemini response has no content");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Gemini response contains no valid JSON");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    if (!analysis.feedback || !analysis.score5s || !analysis.riskLevel) {
      throw new Error("Gemini response missing required fields");
    }

    return {
      feedback: analysis.feedback,
      score5s: analysis.score5s,
      riskLevel: analysis.riskLevel,
      isAiGenerated: true,
    };
  }

  private async handleAnalysisFailure(submission: any, requestId: string | undefined, error: unknown) {
    logger.error({
      message: "gemini_analysis_failed_fallback",
      submissionId: submission?.id,
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    const fallback = getFallbackAnalysis();
    const xpGain = calculateXpGainForSubmission({
      baseXp: submission?.quest?.baseXp ?? 10,
      score5s: fallback.score5s,
      riskLevel: fallback.riskLevel,
    });

    if (!submission) return;

    await (prisma as any).$transaction(async (tx: any) => {
      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: "failed",
          aiFeedback: fallback.feedback,
          aiScore5s: JSON.stringify(fallback.score5s),
          aiRiskLevel: fallback.riskLevel,
          xpGain,
        },
      });

      if (submission.userQuest) {
        await tx.userQuest.update({
          where: { id: submission.userQuest.id },
          data: { status: "failed" },
        });
      }

      await tx.xpLog.create({
        data: {
          userId: submission.userId,
          source: "submission",
          xpChange: xpGain,
          note: `Quest ${submission.quest.title} submission fallback applied`,
        },
      });

      await tx.user.update({
        where: { id: submission.userId },
        data: { totalXp: { increment: xpGain } },
      });
    });
  }

  public getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }
}

export const geminiService = new GeminiService();
