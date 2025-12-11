"use client";

import React, { useMemo, useState } from "react";
import type { Quest } from "@/types/quest";
import { SubmissionForm } from "@/src/components/SubmissionForm";

interface QuestDetailModalProps {
  quest: Quest | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestDetailModal: React.FC<QuestDetailModalProps> = ({
  quest,
  isOpen,
  onClose,
}) => {
  const [showForm, setShowForm] = useState(false);

  const objectives = useMemo(() => {
    if (!quest?.objectives) return [];
    if (Array.isArray(quest.objectives)) return quest.objectives;

    try {
      const parsed = JSON.parse(quest.objectives);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Unable to parse objectives", error);
      return [];
    }
  }, [quest]);

  if (!isOpen || !quest) return null;

  const handleSubmitSuccess = () => {
    setShowForm(false);
    onClose();
  };

  const handleCancel = () => {
    setShowForm(false);
    onClose();
  };

  const difficultyStars =
    quest.difficulty === "hard" ? 3 : quest.difficulty === "medium" ? 2 : 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start p-6 border-b">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{quest.title}</h2>
            <p className="text-sm text-gray-500">{quest.leanConcept}</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close quest details"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{quest.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Difficulty</p>
              <p className="font-semibold text-gray-900">{"★".repeat(difficultyStars)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-semibold text-gray-900">{quest.leanConcept}</p>
            </div>
          </div>

          {objectives.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Objectives</h3>
              <ul className="space-y-2">
                {objectives.map((obj, i) => (
                  <li key={`${obj}-${i}`} className="flex items-start">
                    <span className="text-blue-500 mr-2">✓</span>
                    <span className="text-gray-700">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">XP Reward</p>
              <p className="text-2xl font-bold text-blue-600">+{quest.xpReward}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Time Estimate</p>
              <p className="text-2xl font-bold text-gray-800">{quest.timeEstimate} min</p>
            </div>
          </div>

          {showForm ? (
            <SubmissionForm
              questId={quest.id}
              onSuccess={handleSubmitSuccess}
              onCancel={handleCancel}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Submit Your Answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
