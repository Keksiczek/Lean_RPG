"use client";

import React from "react";
import type { IshikawaProblem } from "@/types/ishikawa";
import { ISHIKAWA_PROBLEMS } from "@/data/ishikawaProblems";

interface IshikawaProblemSelectorProps {
  onSelectProblem: (problem: IshikawaProblem) => void;
}

export const IshikawaProblemSelector: React.FC<
  IshikawaProblemSelectorProps
> = ({ onSelectProblem }) => {
  return (
    <div className="space-y-6 py-8" aria-label="Ishikawa problem selector">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Ishikawa Diagram Builder
        </h1>
        <p className="text-gray-600">
          Analyze root causes and find solutions
        </p>
      </div>

      <div className="space-y-3 max-w-2xl mx-auto">
        {ISHIKAWA_PROBLEMS.map((problem) => (
          <button
            key={problem.id}
            onClick={() => onSelectProblem(problem)}
            className="w-full p-4 rounded-lg border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition text-left"
            aria-label={`Select problem ${problem.title}`}
            type="button"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {problem.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {problem.description}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded text-sm font-semibold ${
                  problem.difficulty === "easy"
                    ? "bg-green-100 text-green-700"
                    : problem.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
                aria-label={`Difficulty ${problem.difficulty}`}
              >
                {problem.difficulty.toUpperCase()}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded max-w-2xl mx-auto text-center text-sm text-gray-700">
        💡 <span className="font-semibold">Tip:</span> Analyze the problem,
        identify root causes, and discover solutions!
      </div>
    </div>
  );
};
