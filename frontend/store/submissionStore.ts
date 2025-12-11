'use client';

import { create } from 'zustand';
import type { SubmissionFeedback } from '@/types/submission';

type SubmissionStatus = 'idle' | 'submitting' | 'polling' | 'completed' | 'error';
type SubmissionIdentifier = number | string;

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

  submitAnswer: (
    questId: SubmissionIdentifier,
    content: string,
    file?: File
  ) => Promise<number>;
  pollSubmissionStatus: (submissionId: number) => Promise<SubmissionFeedback | null>;
  resetForm: () => void;
}

type SubmitResponse = {
  id: number;
};

type SubmissionStatusResponse = {
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  progress?: number;
  result?: SubmissionFeedback;
  error?: string;
};

export const useSubmissionStore = create<SubmissionState>((set, get) => ({
  currentSubmissionId: null,
  submissionProgress: 0,
  submissionStatus: 'idle',
  submissionError: null,
  submissionFeedback: null,
  formContent: '',
  formFile: null,

  setFormContent: (content) => set({ formContent: content }),
  setFormFile: (file) => set({ formFile: file }),
  setSubmissionProgress: (progress) => set({ submissionProgress: progress }),
  setSubmissionStatus: (status) => set({ submissionStatus: status }),
  setSubmissionError: (error) => set({ submissionError: error }),
  setSubmissionFeedback: (feedback) => set({ submissionFeedback: feedback }),
  setCurrentSubmissionId: (id) => set({ currentSubmissionId: id }),

  submitAnswer: async (questId, content, file) => {
    try {
      set({
        submissionStatus: 'submitting',
        submissionError: null,
        submissionProgress: 0,
        submissionFeedback: null,
      });

      const formData = new FormData();
      formData.append('questId', String(questId));
      formData.append('content', content);
      if (file) {
        formData.append('screenshot', file);
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.statusText}`);
      }

      const data = (await response.json()) as SubmitResponse;
      set({
        currentSubmissionId: data.id,
        submissionStatus: 'polling',
        submissionProgress: 10,
      });

      return data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submit failed';
      set({
        submissionStatus: 'error',
        submissionError: message,
      });
      throw error;
    }
  },

  pollSubmissionStatus: async (submissionId) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/submissions/${submissionId}/status`, {
        method: 'GET',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error('Poll failed');
      }

      const data = (await response.json()) as SubmissionStatusResponse;

      if (typeof data.progress === 'number') {
        set({ submissionProgress: Math.min(Math.max(data.progress, 0), 100) });
      }

      if (data.status === 'completed' && data.result) {
        set({
          submissionStatus: 'completed',
          submissionFeedback: data.result,
          submissionProgress: 100,
        });
        return data.result;
      }

      if (data.status === 'failed') {
        set({
          submissionStatus: 'error',
          submissionError: data.error || 'Submission failed',
        });
        return null;
      }

      if (get().submissionStatus !== 'polling') {
        set({ submissionStatus: 'polling' });
      }

      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Poll failed';
      set({
        submissionStatus: 'error',
        submissionError: message,
      });
      return null;
    }
  },

  resetForm: () =>
    set({
      formContent: '',
      formFile: null,
      submissionStatus: 'idle',
      submissionError: null,
      submissionFeedback: null,
      currentSubmissionId: null,
      submissionProgress: 0,
    }),
}));
