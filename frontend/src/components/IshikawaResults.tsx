"use client";

import React from "react";
import { useIshikawaStore } from "@/src/store/ishikawaStore";

interface IshikawaResultsProps {
  onNext: () => void;
}

export const IshikawaResults: React.FC<IshikawaResultsProps> = ({
  onNext,
}) => {
  const result = useIshikawaStore((state) => state.result);
  const currentProblem = useIshikawaStore((state) => state.currentProblem);

  if (!result || !currentProblem) return null;

  return (
    <div className="space-y-6 py-8 text-center" aria-label="Ishikawa analysis results">
      <div className="text-6xl mb-3" aria-hidden>
        ✅
      </div>
      <h2 className="text-3xl font-bold text-gray-900">Analysis Complete!</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Root Causes Found</p>
          <p className="text-3xl font-bold text-blue-600">
            {result.causes.length}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Solutions Generated</p>
          <p className="text-3xl font-bold text-purple-600">
            {result.solutions.length}
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-sm text-gray-600">Score</p>
          <p className="text-3xl font-bold text-yellow-600">
            {result.score} pts
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">XP Earned</p>
          <p className="text-3xl font-bold text-green-600">
            +{result.xpEarned} XP
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
        aria-label="Start next analysis"
        type="button"
      >
        Next Analysis
      </button>
    </div>
  );
};
