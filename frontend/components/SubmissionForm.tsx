'use client';

import { useState } from 'react';
import { useSubmissionStore } from '../store/submissionStore';
import { SubmissionFeedback } from './SubmissionFeedback';
import { SubmissionStatusPoller } from './SubmissionStatusPoller';

interface SubmissionFormProps {
  questId: number | string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  questId,
  onSuccess,
  onCancel,
}) => {
  const store = useSubmissionStore();
  const [errors, setErrors] = useState<string[]>([]);

  const isValid =
    store.formContent.trim().length >= 10 && store.formContent.trim().length <= 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const contentLength = store.formContent.trim().length;
    if (contentLength < 10) {
      setErrors(['Answer must be at least 10 characters']);
      return;
    }

    if (contentLength > 2000) {
      setErrors(['Answer must not exceed 2000 characters']);
      return;
    }

    if (store.formFile && store.formFile.size > 5 * 1024 * 1024) {
      setErrors(['File size must not exceed 5MB']);
      return;
    }

    try {
      await store.submitAnswer(questId, store.formContent, store.formFile || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Submit failed';
      setErrors([message]);
    }
  };

  if (store.submissionStatus === 'polling' || store.submissionStatus === 'submitting') {
    return <SubmissionStatusPoller submissionId={store.currentSubmissionId || 0} />;
  }

  if (store.submissionStatus === 'completed' && store.submissionFeedback) {
    return (
      <SubmissionFeedback
        feedback={store.submissionFeedback}
        onNext={() => {
          store.resetForm();
          onSuccess();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {store.submissionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {store.submissionError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Analysis</label>
        <textarea
          value={store.formContent}
          onChange={(e) => store.setFormContent(e.target.value)}
          maxLength={2000}
          placeholder="Write your detailed analysis here..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={10}
          disabled={store.submissionStatus === 'submitting'}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>
            {store.formContent.trim().length >= 10 ? '✓' : '✗'} Minimum 10 characters
          </span>
          <span>
            {store.formContent.trim().length}/2000
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attach Screenshot (optional)
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => store.setFormFile(e.target.files?.[0] ?? null)}
          className="w-full p-3 border border-gray-300 rounded-lg"
          disabled={store.submissionStatus === 'submitting'}
        />
        {store.formFile && (
          <p className="mt-2 text-sm text-green-600">
            ✓ {store.formFile.name} selected ({(store.formFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={!isValid || store.submissionStatus === 'submitting'}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {store.submissionStatus === 'submitting' ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => {
            store.resetForm();
            onCancel();
          }}
          disabled={store.submissionStatus === 'submitting'}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
