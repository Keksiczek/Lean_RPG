"use client";

import React, { useMemo, useState } from "react";
import { useSubmissionStore } from "@/src/store/submissionStore";
import { SubmissionFeedback } from "./SubmissionFeedback";
import { SubmissionStatusPoller } from "./SubmissionStatusPoller";

interface SubmissionFormProps {
  questId: string | number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  questId,
  onSuccess,
  onCancel,
}) => {
  const {
    formContent,
    formFile,
    submissionStatus,
    submissionFeedback,
    submissionError,
    currentSubmissionId,
    setFormContent,
    setFormFile,
    submitAnswer,
    resetForm,
  } = useSubmissionStore();

  const [errors, setErrors] = useState<string[]>([]);

  const isValid = useMemo(
    () => formContent.length >= 10 && formContent.length <= 2000,
    [formContent]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (formContent.length < 10) {
      setErrors(["Answer must be at least 10 characters"]);
      return;
    }

    if (formContent.length > 2000) {
      setErrors(["Answer must not exceed 2000 characters"]);
      return;
    }

    if (formFile && formFile.size > 5 * 1024 * 1024) {
      setErrors(["File size must not exceed 5MB"]);
      return;
    }

    try {
      await submitAnswer(questId, formContent, formFile ?? undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submit failed";
      setErrors([message]);
    }
  };

  if (submissionStatus === "polling" || submissionStatus === "submitting") {
    return <SubmissionStatusPoller submissionId={currentSubmissionId ?? 0} />;
  }

  if (submissionStatus === "completed" && submissionFeedback) {
    return (
      <SubmissionFeedback
        feedback={submissionFeedback}
        onNext={() => {
          resetForm();
          onSuccess();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      {submissionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {submissionError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Analysis</label>
        <textarea
          value={formContent}
          onChange={(e) => setFormContent(e.target.value)}
          maxLength={2000}
          placeholder="Write your detailed analysis here..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={10}
          disabled={submissionStatus === "submitting"}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{formContent.length >= 10 ? "✓" : "✗"} Minimum 10 characters</span>
          <span>
            {formContent.length}/2000
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Attach Screenshot (optional)</label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
          className="w-full p-3 border border-gray-300 rounded-lg"
          disabled={submissionStatus === "submitting"}
        />
        {formFile && (
          <p className="mt-2 text-sm text-green-600">
            ✓ {formFile.name} selected ({(formFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <button
          type="submit"
          disabled={!isValid || submissionStatus === "submitting"}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submissionStatus === "submitting" ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={() => {
            resetForm();
            onCancel();
          }}
          disabled={submissionStatus === "submitting"}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
