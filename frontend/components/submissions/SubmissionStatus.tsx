'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Sparkles, X } from 'lucide-react';
import { fetchSubmission } from '@/lib/api/submissions';
import type { Submission } from '@/types/api';
import type { SubmissionStatus as SubmissionStatusType } from '@/lib/api/submissions';

interface SubmissionStatusProps {
  submissionId: number;
  onComplete?: (submission: Submission) => void;
  onCancel?: () => void;
}

const ICON_MAP: Record<SubmissionStatusType, typeof AlertCircle> = {
  pending_review: Clock,
  queued: Clock,
  analyzing: Sparkles,
  evaluated: CheckCircle,
  failed: AlertCircle,
};

const STATUS_CONFIG: Record<SubmissionStatusType, { label: string; color: string; bg: string }> = {
  pending_review: {
    label: 'Pending Review',
    color: 'text-slate-300',
    bg: 'bg-slate-700/40',
  },
  queued: {
    label: 'Queued for Analysis',
    color: 'text-blue-300',
    bg: 'bg-blue-800/30',
  },
  analyzing: {
    label: 'Analyzing...',
    color: 'text-purple-300',
    bg: 'bg-purple-800/30',
  },
  evaluated: {
    label: 'Evaluation Complete',
    color: 'text-green-300',
    bg: 'bg-green-800/20',
  },
  failed: {
    label: 'Evaluation Failed',
    color: 'text-red-300',
    bg: 'bg-red-800/30',
  },
};

export default function SubmissionStatus({ submissionId, onComplete, onCancel }: SubmissionStatusProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const progress = useMemo(() => {
    if (!submission) return 0;
    switch (submission.status) {
      case 'pending_review':
        return 10;
      case 'queued':
        return 30;
      case 'analyzing':
        return 60;
      case 'evaluated':
      case 'failed':
        return 100;
      default:
        return 0;
    }
  }, [submission]);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const data = await fetchSubmission(submissionId);
        if (!cancelled) {
          setSubmission(data);
          setIsLoading(false);

          if (data.status === 'evaluated' || data.status === 'failed') {
            onComplete?.(data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch status');
          setIsLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [submissionId, onComplete]);

  const parsed5s = useMemo(() => {
    if (!submission?.aiScore5s) return null;
    try {
      return JSON.parse(submission.aiScore5s) as Record<string, number>;
    } catch (err) {
      console.error('Failed to parse 5S scores', err);
      return null;
    }
  }, [submission?.aiScore5s]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
        <p className="text-slate-400 mt-3">Loading submission status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
        <p className="text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsLoading(true);
          }}
          className="mt-3 text-sm text-red-200 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!submission) return null;

  const config = STATUS_CONFIG[submission.status];
  const IconComponent = ICON_MAP[submission.status];

  return (
    <div className="space-y-6">
      <div className={`p-6 border border-slate-600 rounded-lg ${config.bg}`}>
        <div className="flex items-center gap-3 mb-4">
          <IconComponent className={`w-6 h-6 ${config.color}`} />
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${config.color}`}>{config.label}</h3>
            <p className="text-slate-400 text-sm">Submission #{submission.id}</p>
          </div>
          {['queued', 'pending_review'].includes(submission.status) && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-200 bg-red-800/50 border border-red-600 rounded-lg hover:bg-red-800"
            >
              <X className="w-4 h-4" /> Cancel submission
            </button>
          )}
        </div>

        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {submission.status === 'evaluated' && (
        <div className="space-y-6">
          {typeof submission.xpGain === 'number' && (
            <div className="p-6 bg-yellow-700/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-300 text-sm font-medium">XP Earned</p>
              <p className="text-4xl font-bold text-yellow-400 mt-2">+{submission.xpGain}</p>
            </div>
          )}

          {submission.aiFeedback && (
            <div className="p-6 bg-slate-700/30 border border-slate-600 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Feedback</h4>
              <p className="text-slate-300 leading-relaxed">{submission.aiFeedback}</p>
            </div>
          )}

          {parsed5s && (
            <div className="p-6 bg-slate-700/30 border border-slate-600 rounded-lg">
              <h4 className="font-semibold text-white mb-4">5S Assessment</h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {Object.entries(parsed5s).map(([key, value]) => (
                  <div key={key} className="p-3 bg-slate-800 rounded text-center">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">{key}</p>
                    <p className="text-lg font-bold text-blue-400 mt-2">{value}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.aiRiskLevel && (
            <div className="p-6 bg-slate-700/30 border border-slate-600 rounded-lg">
              <p className="text-slate-400 text-sm font-medium">Risk Level</p>
              <span
                className={`mt-2 inline-block px-3 py-1 rounded-full font-semibold ${
                  submission.aiRiskLevel === 'LOW'
                    ? 'bg-green-700/30 text-green-300'
                    : submission.aiRiskLevel === 'MEDIUM'
                      ? 'bg-yellow-700/30 text-yellow-300'
                      : 'bg-red-700/30 text-red-300'
                }`}
              >
                {submission.aiRiskLevel}
              </span>
            </div>
          )}
        </div>
      )}

      {submission.status === 'failed' && (
        <div className="p-6 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-200">Evaluation failed. Please adjust your submission and try again.</p>
        </div>
      )}
    </div>
  );
}
