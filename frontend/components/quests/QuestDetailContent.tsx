'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import SubmissionForm from '@/components/submissions/SubmissionForm';
import SubmissionStatus, {
  type Submission as SubmissionResult,
} from '@/components/submissions/SubmissionStatus';
import type { Quest } from '@/types/api';

interface QuestDetailContentProps {
  quest: Quest;
}

export default function QuestDetailContent({ quest }: QuestDetailContentProps) {
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [completedSubmission, setCompletedSubmission] =
    useState<SubmissionResult | null>(null);

  const difficultyColor = useMemo(() => {
    switch (quest.difficulty) {
      case 'easy':
        return 'text-green-300';
      case 'hard':
        return 'text-red-300';
      case 'medium':
      default:
        return 'text-blue-300';
    }
  }, [quest.difficulty]);

  const handleStartNew = () => {
    setSubmissionId(null);
    setCompletedSubmission(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/quests" className="p-2 hover:bg-slate-700 rounded-lg transition">
          <ChevronLeft className="w-6 h-6 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-white">{quest.title}</h1>
          <p className="text-slate-400 mt-2">{quest.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <p className="text-slate-400 text-sm">Base XP</p>
          <p className="text-2xl font-bold text-yellow-400">+{quest.baseXp}</p>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <p className="text-slate-400 text-sm">Difficulty</p>
          <p className={`text-2xl font-bold capitalize ${difficultyColor}`}>
            {quest.difficulty || 'medium'}
          </p>
        </div>

        {quest.leanConcept && (
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Lean Concept</p>
            <p className="text-lg font-bold text-purple-400">{quest.leanConcept}</p>
          </div>
        )}
      </div>

      {quest.briefText && (
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Briefing</h2>
          <p className="text-slate-300 leading-relaxed">{quest.briefText}</p>
        </div>
      )}

      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-white">Submission</h2>
          {submissionId && (
            <button
              type="button"
              onClick={handleStartNew}
              className="text-sm text-slate-200 underline"
            >
              Start over
            </button>
          )}
        </div>
        {!submissionId ? (
          <SubmissionForm
            questId={quest.id}
            onSubmissionCreated={(id) => setSubmissionId(id)}
          />
        ) : (
          <SubmissionStatus
            submissionId={submissionId}
            onComplete={setCompletedSubmission}
            onCancel={handleStartNew}
          />
        )}

        {completedSubmission && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleStartNew}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600"
            >
              Submit another solution
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
