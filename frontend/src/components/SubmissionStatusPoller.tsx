"use client";

import React, { useEffect } from "react";
import { useSubmissionStore } from "@/src/store/submissionStore";

interface SubmissionStatusPollerProps {
  submissionId: number;
}

export const SubmissionStatusPoller: React.FC<SubmissionStatusPollerProps> = ({
  submissionId,
}) => {
  const submissionStatus = useSubmissionStore((state) => state.submissionStatus);
  const submissionError = useSubmissionStore((state) => state.submissionError);
  const submissionProgress = useSubmissionStore((state) => state.submissionProgress);
  const pollSubmissionStatus = useSubmissionStore((state) => state.pollSubmissionStatus);
  const resetForm = useSubmissionStore((state) => state.resetForm);

  useEffect(() => {
    if (!submissionId || submissionStatus !== "polling") return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      if (!isMounted) return;
      await pollSubmissionStatus(submissionId);
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [pollSubmissionStatus, submissionId, submissionStatus]);

  if (submissionStatus === "error") {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Submission Failed</h3>
        <p className="text-gray-600 mb-4">{submissionError}</p>
        <button
          onClick={() => resetForm()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-8 space-y-4">
      <div className="text-4xl mb-4">🔄</div>
      <h3 className="text-xl font-semibold text-gray-900">Analyzing your submission...</h3>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${submissionProgress}%` }}
        />
      </div>
      <p className="text-gray-600">{Math.round(submissionProgress)}% complete</p>
      <p className="text-sm text-gray-500">Using Gemini AI to analyze your response...</p>
    </div>
  );
};
