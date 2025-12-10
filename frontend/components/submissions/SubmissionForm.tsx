'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadFile } from '@/lib/api/files';
import { createSubmission } from '@/lib/api/submissions';

interface SubmissionFormProps {
  questId: number;
  onSubmissionCreated: (submissionId: number) => void;
}

export default function SubmissionForm({ questId, onSubmissionCreated }: SubmissionFormProps) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Solution text is required');
      return;
    }

    if (content.length > 5000) {
      setError('Solution text must be under 5000 characters');
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, {
          folder: 'submissions',
          maxSize: 5 * 1024 * 1024,
        });
      }

      const response = await createSubmission({ questId, content, imageUrl });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || 'Failed to submit solution');
      }

      const submissionId = payload?.submissionId ?? payload?.id;
      if (!submissionId) {
        throw new Error('Submission response missing ID');
      }

      onSubmissionCreated(submissionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setImagePreview(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-2">
          Your Solution
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={8}
          disabled={isLoading}
          placeholder="Describe your approach to solving this problem..."
          className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
          <p>Markdown formatting supported</p>
          <p>
            {content.length} / 5000
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Attachment (Optional)</label>
        {!imagePreview ? (
          <label
            htmlFor="image"
            className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-300 font-medium">Click to upload image</p>
              <p className="text-slate-400 text-sm mt-1">PNG, JPG, WebP up to 5MB</p>
            </div>
            <input
              id="image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              disabled={isLoading}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-64 object-contain rounded-lg bg-slate-900"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isLoading}
              className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin">⏳</div>
            Submitting...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Submit Solution
          </>
        )}
      </button>
    </form>
  );
}
