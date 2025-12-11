"use client";

import React from "react";
import type { IshikawaSolution } from "@/types/ishikawa";

interface IshikawaSolutionsDisplayProps {
  solutions: IshikawaSolution[];
}

export const IshikawaSolutionsDisplay: React.FC<
  IshikawaSolutionsDisplayProps
> = ({ solutions }) => {
  const sortedSolutions = [...solutions].sort(
    (a, b) => b.priority - a.priority
  );

  return (
    <div className="space-y-6" aria-label="Solution recommendations">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Recommended Solutions
        </h3>
        <p className="text-gray-600">
          Based on your root cause analysis, here are the most effective
          solutions:
        </p>
      </div>

      <div className="space-y-4">
        {sortedSolutions.map((solution, index) => (
          <div
            key={solution.id}
            className="bg-white p-6 rounded-lg border-l-4 border-blue-600"
            aria-label={`Solution ${index + 1}: ${solution.title}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    #{index + 1}
                  </span>
                  <h4 className="text-lg font-bold text-gray-900">
                    {solution.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {solution.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Impact</p>
                <p className="text-lg font-bold text-green-600">
                  {solution.expectedImpact}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Difficulty</p>
                <p className="text-lg font-bold text-gray-900">
                  {solution.difficulty.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost</p>
                <p className="text-lg font-bold text-gray-900">
                  {solution.estimatedCost.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="text-lg font-bold text-blue-600">
                  {solution.priority}/10
                </p>
              </div>
            </div>

            {solution.implementationSteps.length > 0 && (
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  Implementation Steps:
                </p>
                <ol className="space-y-1">
                  {solution.implementationSteps.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                      {idx + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
