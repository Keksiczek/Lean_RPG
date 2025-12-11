"use client";

import React from "react";
import type { AuditScene, FiveS } from "@/types/audit";
import { useAuditStore } from "@/src/store/auditStore";

const FIVE_S_INFO: Record<FiveS, { jp: string; en: string; description: string }> = {
  seiri: {
    jp: "整理",
    en: "Sort",
    description: "Remove unnecessary items",
  },
  seiton: {
    jp: "整頓",
    en: "Set",
    description: "Organize remaining items",
  },
  seiso: {
    jp: "清掃",
    en: "Shine",
    description: "Clean the workplace",
  },
  seiketsu: {
    jp: "清潔",
    en: "Standardize",
    description: "Maintain standards",
  },
  shitsuke: {
    jp: "躾",
    en: "Sustain",
    description: "Discipline and habits",
  },
};

interface AuditCategorizationProps {
  scene: AuditScene;
}

export const AuditCategorization: React.FC<AuditCategorizationProps> = ({ scene }) => {
  const { foundProblems, categorization, categorizeProblem } = useAuditStore();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Categorize Found Problems</h3>

      {foundProblems.map((problemId) => {
        const problem = scene.problems.find((p) => p.id === problemId);
        const selected = categorization[problemId];

        return (
          <div key={problemId} className="bg-gray-50 p-4 rounded space-y-3">
            <p className="font-medium">
              Problem {problemId}: {problem?.description ?? "Problem details unavailable"}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {(Object.keys(FIVE_S_INFO) as FiveS[]).map((category) => (
                <button
                  key={category}
                  onClick={() => categorizeProblem(problemId, category)}
                  className={`p-3 rounded text-center text-sm font-semibold transition ${
                    selected === category
                      ? "bg-blue-600 text-white"
                      : "bg-white border-2 border-gray-300 hover:border-blue-400"
                  }`}
                  aria-pressed={selected === category}
                  aria-label={`Mark problem ${problemId} as ${FIVE_S_INFO[category].en}`}
                >
                  <div className="text-xl mb-1">{FIVE_S_INFO[category].jp}</div>
                  <div className="text-xs">{FIVE_S_INFO[category].en}</div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    {FIVE_S_INFO[category].description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
