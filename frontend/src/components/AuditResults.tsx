"use client";

import React from "react";
import { useAuditStore } from "@/src/store/auditStore";

interface AuditResultsProps {
  onNext: () => void;
}

export const AuditResults: React.FC<AuditResultsProps> = ({ onNext }) => {
  const result = useAuditStore((state) => state.result);
  const currentScene = useAuditStore((state) => state.currentScene);

  if (!result || !currentScene) return null;

  const accuracy = Math.round((result.correctCategories / result.totalProblems) * 100);

  return (
    <div className="space-y-6 py-8 text-center">
      <div className="text-6xl mb-3" role="img" aria-label="Audit complete">
        ✅
      </div>
      <h2 className="text-3xl font-bold text-gray-900">Audit Complete!</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Problems Found</p>
          <p className="text-3xl font-bold text-blue-600">
            {result.foundProblems.length}/{result.totalProblems}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Accuracy</p>
          <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-sm text-gray-600">Score</p>
          <p className="text-3xl font-bold text-yellow-600">{result.score} pts</p>
        </div>

        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">XP Earned</p>
          <p className="text-3xl font-bold text-purple-600">+{result.xpEarned} XP</p>
        </div>

        <div className="bg-orange-50 p-4 rounded md:col-span-2">
          <p className="text-sm text-gray-600">Time Spent</p>
          <p className="text-2xl font-bold text-orange-600">
            {Math.floor(result.timeTaken / 60)}:{String(result.timeTaken % 60).padStart(2, "0")}
            <span className="text-base text-gray-700"> / {Math.floor(currentScene.timeLimit / 60)}:{String(currentScene.timeLimit % 60).padStart(2, "0")}</span>
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
      >
        Next Audit
      </button>
    </div>
  );
};
