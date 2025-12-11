import { create } from "zustand";
import type {
  IshikawaProblem,
  IshikawaCause,
  IshikawaSolution,
  IshikawaResult,
  IshikawaState,
  IshikawaCategoryName,
} from "@/types/ishikawa";

export const useIshikawaStore = create<IshikawaState>((set, get) => ({
  currentProblem: null,
  causes: [],
  solutions: [],
  categoryType: "6M",
  status: "idle",
  result: null,

  selectProblem: (problem) =>
    set({
      currentProblem: problem,
      causes: [],
      solutions: [],
      status: "building",
      result: null,
    }),

  setCategoryType: (type) => set({ categoryType: type }),

  addCause: (category, text) => {
    const newCause: IshikawaCause = {
      id: `cause-${Date.now()}`,
      category,
      text,
    };
    set((state) => ({
      causes: [...state.causes, newCause],
    }));
  },

  removeCause: (causeId) => {
    set((state) => ({
      causes: state.causes.filter((c) => c.id !== causeId),
    }));
  },

  generateSolutions: async () => {
    const { currentProblem, causes } = get();
    if (!currentProblem) throw new Error("No problem selected");

    try {
      const response = await fetch("/api/ishikawa/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({
          problemId: currentProblem.id,
          causes,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");
      const solutions: IshikawaSolution[] = await response.json();
      set({ solutions, status: "analyzing" });
      return solutions;
    } catch (error) {
      console.error("Failed to generate solutions", error);
      throw error;
    }
  },

  submitAnalysis: async () => {
    const { currentProblem, causes, solutions } = get();
    if (!currentProblem) throw new Error("No problem selected");

    // Calculate score based on analysis quality
    const score = Math.min(
      1000,
      causes.length * 50 + solutions.length * 100
    );

    const result: IshikawaResult = {
      problemId: currentProblem.id,
      causes,
      solutions,
      score,
      xpEarned: Math.round(score / 2),
      completedAt: new Date(),
    };

    try {
      const response = await fetch("/api/ishikawa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify(result),
      });

      if (!response.ok) throw new Error("Submit failed");
    } catch (error) {
      console.error("Failed to submit analysis", error);
    }

    set({ status: "completed", result });
    return result;
  },

  reset: () =>
    set({
      currentProblem: null,
      causes: [],
      solutions: [],
      categoryType: "6M",
      status: "idle",
      result: null,
    }),
}));
