import prisma from "../lib/prisma.js";
import { analyzeSubmissionWithGemini } from "../lib/gemini.js";
import { calculateXpGainForSubmission } from "../lib/xp.js";
import logger from "../lib/logger.js";
import { HttpError } from "../middleware/errors.js";

export class GeminiService {
  async processSubmission(data: { submissionId: number; requestId?: string }) {
    const { submissionId, requestId } = data;
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        quest: true,
        userQuest: true,
        workstation: { include: { area: { include: { knowledgePacks: true } } } },
      },
    });

    if (!submission) {
      throw new HttpError("Submission not found", 404);
    }

    const areaContext = submission.workstation
      ? submission.workstation.area?.knowledgePacks?.[0]?.content ?? null
      : null;

    try {
      const analysis = await analyzeSubmissionWithGemini({
        textInput: submission.textInput ?? null,
        imageUrl: submission.imageUrl ?? null,
        areaContext,
        requestId,
      });

      const xpGain = calculateXpGainForSubmission({
        baseXp: submission.quest.baseXp,
        score5s: analysis.score5s,
        riskLevel: analysis.riskLevel,
      });

      await prisma.$transaction(async (tx) => {
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
    } catch (error) {
      logger.error({
        message: "Gemini analysis failed",
        submissionId,
        requestId,
        error: error instanceof Error ? error.message : String(error),
      });

      const fallbackFeedback =
        "AI analýza není momentálně dostupná. " +
        "Vaše řešení bylo uloženo a bude zpracováno později. " +
        "Pokud chyba přetrvává, kontaktujte podporu.";

      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "failed",
          aiFeedback: fallbackFeedback,
          aiRiskLevel: "error",
        },
      });
    }
  }
}
