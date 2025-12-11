"use client";

import { create } from "zustand";
import type { AuditResult, AuditScene, AuditState } from "@/types/audit";

export const useAuditStore = create<AuditState>((set, get) => ({
  currentScene: null,
  foundProblems: [],
  categorization: {},
  status: "idle",
  timeRemaining: 0,
  result: null,
  selectedProblem: null,

  startAudit: (scene) =>
    set({
      currentScene: scene,
      foundProblems: [],
      categorization: {},
      status: "playing",
      timeRemaining: scene.timeLimit,
      result: null,
      selectedProblem: null,
    }),

  toggleProblem: (problemId) => {
    const { foundProblems } = get();
    const newFound = foundProblems.includes(problemId)
      ? foundProblems.filter((id) => id !== problemId)
      : [...foundProblems, problemId];
    set({ foundProblems: newFound, selectedProblem: problemId });
  },

  categorizeProblem: (problemId, category) => {
    set((state) => ({
      categorization: {
        ...state.categorization,
        [problemId]: category,
      },
    }));
  },

  finishAudit: async () => {
    const { currentScene, foundProblems, categorization, status, timeRemaining } = get();
    if (!currentScene) throw new Error("No active audit");
    if (status === "finished" && get().result) {
      return get().result as AuditResult;
    }

    const correctCategories = foundProblems.filter((id) => {
      const problem = currentScene.problems.find((p) => p.id === id);
      return problem && categorization[id] === problem.category;
    }).length;

    const accuracy = (correctCategories / currentScene.problems.length) * 100;
    const score = Math.round(accuracy * 10);

    const timeTaken = currentScene.timeLimit - timeRemaining;

    const result: AuditResult = {
      sceneId: currentScene.id,
      foundProblems,
      categorization,
      correctCategories,
      totalProblems: currentScene.problems.length,
      timeTaken,
      score,
      xpEarned: Math.round(score / 2),
    };

    try {
      const response = await fetch("/api/audits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) throw new Error("Submit failed");
    } catch (error) {
      console.error("Failed to submit audit result", error);
    }

    set({ status: "finished", result });
    return result;
  },

  resetAudit: () =>
    set({
      currentScene: null,
      foundProblems: [],
      categorization: {},
      status: "idle",
      timeRemaining: 0,
      result: null,
      selectedProblem: null,
    }),

  decrementTime: () => {
    let updatedTime = 0;
    set((state) => {
      updatedTime = Math.max(0, state.timeRemaining - 1);
      return { timeRemaining: updatedTime };
    });
    return updatedTime;
  },
}));
