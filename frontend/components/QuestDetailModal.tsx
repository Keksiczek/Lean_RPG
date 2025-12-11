'use client';

import { useMemo, useState } from 'react';
import { SubmissionForm } from './SubmissionForm';
import { useSubmissionStore } from '../store/submissionStore';
import type { Quest } from '@/types/quest';

type QuestWithArea = Quest & {
  area?: {
    name?: string;
  } | null;
  type?: string;
};

interface QuestDetailModalProps {
  quest: QuestWithArea | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestDetailModal: React.FC<QuestDetailModalProps> = ({
  quest,
  isOpen,
  onClose,
}) => {
  const [showForm, setShowForm] = useState(false);
  const resetForm = useSubmissionStore((state) => state.resetForm);

  const objectives = useMemo(() => {
    if (!quest?.objectives) return [] as string[];
    if (Array.isArray(quest.objectives)) return quest.objectives;
    try {
      const parsed = JSON.parse(quest.objectives as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Unable to parse objectives', error);
      return [];
    }
  }, [quest]);

  if (!isOpen || !quest) return null;

  const handleSubmitSuccess = () => {
    setShowForm(false);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    setShowForm(false);
    onClose();
  };

  const questId = quest.id;
  const xpReward = quest.xpReward ?? quest.baseXp ?? 0;
  const questType = quest.leanConcept ?? quest.type ?? 'Quest';

  const difficultyStars =
    quest.difficulty === 'hard'
      ? '★★★'
      : quest.difficulty === 'medium'
        ? '★★'
        : '★';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{quest.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {quest.area?.name ?? 'Unknown area'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close quest details"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{quest.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Difficulty</p>
              <p className="font-semibold text-gray-900">{difficultyStars}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-semibold text-gray-900">{questType}</p>
            </div>
          </div>

          {objectives.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Objectives</h3>
              <ul className="space-y-2">
                {objectives.map((obj, i) => (
                  <li key={obj + i} className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    <span className="text-gray-700">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">XP Reward</p>
            <p className="text-2xl font-bold text-blue-600">+{xpReward}</p>
          </div>

          {showForm ? (
            <SubmissionForm
              questId={questId}
              onSuccess={handleSubmitSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              type="button"
            >
              Submit Your Answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
