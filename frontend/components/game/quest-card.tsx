// Quest card component

import { Quest, getDifficultyColor } from '@/lib/quests';

interface QuestCardProps {
  quest: Quest;
  onStart: (questId: number) => void;
}

export function QuestCard({ quest, onStart }: QuestCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(quest.difficulty)}`}>
          {quest.difficulty}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{quest.description}</p>

      {/* Lean Concept Badge */}
      {quest.leanConcept && (
        <div className="mb-4">
          <span className="inline-block px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {quest.leanConcept}
          </span>
        </div>
      )}

      {/* Footer: XP + Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-700">
          <span className="text-yellow-600">+{quest.baseXp} XP</span>
        </div>
        <button
          onClick={() => onStart(quest.id)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
        >
          Start Quest
        </button>
      </div>
    </div>
  );
}
