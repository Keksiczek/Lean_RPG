"use client";

import { create } from "zustand";
import type { SubmissionFeedback } from "@/types/submission";

type SubmissionStatus = "idle" | "submitting" | "polling" | "completed" | "error";

interface SubmissionState {
  currentSubmissionId: number | null;
  submissionProgress: number;
  submissionStatus: SubmissionStatus;
  submissionError: string | null;
  submissionFeedback: SubmissionFeedback | null;
  formContent: string;
  formFile: File | null;
  setFormContent: (content: string) => void;
  setFormFile: (file: File | null) => void;
  setSubmissionProgress: (progress: number) => void;
  setSubmissionStatus: (status: SubmissionStatus) => void;
  setSubmissionError: (error: string | null) => void;
  setSubmissionFeedback: (feedback: SubmissionFeedback | null) => void;
  setCurrentSubmissionId: (id: number | null) => void;
  submitAnswer: (questId: number | string, content: string, file?: File) => Promise<number>;
  pollSubmissionStatus: (submissionId: number) => Promise<SubmissionFeedback | null>;
  resetForm: () => void;
}

export const useSubmissionStore = create<SubmissionState>((set) => ({
  currentSubmissionId: null,
  submissionProgress: 0,
  submissionStatus: "idle",
  submissionError: null,
  submissionFeedback: null,
  formContent: "",
  formFile: null,
  setFormContent: (content) => set({ formContent: content }),
  setFormFile: (file) => set({ formFile: file }),
  setSubmissionProgress: (progress) =>
    set({ submissionProgress: Math.max(0, Math.min(100, progress)) }),
  setSubmissionStatus: (status) => set({ submissionStatus: status }),
  setSubmissionError: (error) => set({ submissionError: error }),
  setSubmissionFeedback: (feedback) => set({ submissionFeedback: feedback }),
  setCurrentSubmissionId: (id) => set({ currentSubmissionId: id }),
  submitAnswer: async (questId, content, file) => {
    try {
      set({ submissionStatus: "submitting", submissionError: null, submissionProgress: 0 });

      const formData = new FormData();
      formData.append("questId", String(questId));
      formData.append("content", content);
      if (file) {
        formData.append("screenshot", file);
      }

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.statusText}`);
      }

      const data: { id: number } = await response.json();
      set({ currentSubmissionId: data.id, submissionStatus: "polling" });

      return data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submit failed";
      set({ submissionStatus: "error", submissionError: message });
      throw error;
    }
  },
  pollSubmissionStatus: async (submissionId) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Poll failed");
      }

      const data: {
        progress?: number;
        status?: string;
        result?: SubmissionFeedback;
        error?: string;
      } = await response.json();

      set({ submissionProgress: data.progress ?? 0 });

      if (data.status === "completed" && data.result) {
        set({
          submissionStatus: "completed",
          submissionFeedback: data.result,
          submissionProgress: 100,
        });
        return data.result;
      }

      if (data.status === "failed") {
        set({ submissionStatus: "error", submissionError: data.error ?? "Submission failed" });
        return null;
      }

      if (data.status === "pending" || data.status === "processing") {
        set({ submissionStatus: "polling" });
      }

      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Poll failed";
      set({ submissionStatus: "error", submissionError: message });
      return null;
    }
  },
  resetForm: () =>
    set({
      formContent: "",
      formFile: null,
      submissionStatus: "idle",
      submissionError: null,
      submissionFeedback: null,
      currentSubmissionId: null,
      submissionProgress: 0,
    }),
}));
