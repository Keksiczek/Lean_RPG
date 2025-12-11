"use client";

import React, { useEffect } from "react";
import type { IshikawaProblem } from "@/types/ishikawa";
import { useIshikawaStore } from "@/src/store/ishikawaStore";
import { IshikawaProblemSelector } from "./IshikawaProblemSelector";
import { IshikawaDiagramBuilder } from "./IshikawaDiagramBuilder";
import { IshikawaSolutionsDisplay } from "./IshikawaSolutionsDisplay";
import { IshikawaResults } from "./IshikawaResults";

interface IshikawaGameProps {
  onComplete: () => void;
}

export const IshikawaGame: React.FC<IshikawaGameProps> = ({ onComplete }) => {
  const {
    currentProblem,
    solutions,
    status,
    selectProblem,
    generateSolutions,
    submitAnalysis,
    reset,
  } = useIshikawaStore();

  useEffect(() => {
    return () => reset();
  }, [reset]);

  if (!currentProblem) {
    return (
      <IshikawaProblemSelector
        onSelectProblem={(problem: IshikawaProblem) => selectProblem(problem)}
      />
    );
  }

  if (status === "completed") {
    return (
      <IshikawaResults
        onNext={() => {
          reset();
          onComplete();
        }}
      />
    );
  }

  return (
    <div className="space-y-8" aria-label="Ishikawa game">
      <IshikawaDiagramBuilder
        problem={currentProblem}
        onGenerateSolutions={async () => {
          try {
            await generateSolutions();
          } catch (error) {
            console.error("Failed to generate solutions", error);
          }
        }}
        onSubmit={async () => {
          try {
            await submitAnalysis();
          } catch (error) {
            console.error("Failed to submit analysis", error);
          }
        }}
      />

      {solutions.length > 0 && (
        <div className="border-t-2 border-gray-200 pt-8">
          <IshikawaSolutionsDisplay solutions={solutions} />
        </div>
      )}
    </div>
  );
};
