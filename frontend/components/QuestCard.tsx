'use client';

import Link from 'next/link';
import { Quest, Difficulty } from '@/types/quest';

interface QuestCardProps {
  quest: Quest;
  onSelect?: (quest: Quest) => void;
}

export function QuestCard({ quest, onSelect }: QuestCardProps) {
  const difficultyConfig: Record<
    Difficulty,
    { color: string; label: string; bgColor: string }
  > = {
    easy: {
      color: 'text-green-600',
      label: 'Easy',
      bgColor: 'bg-green-100',
    },
    medium: {
      color: 'text-yellow-600',
      label: 'Medium',
      bgColor: 'bg-yellow-100',
    },
    hard: {
      color: 'text-red-600',
      label: 'Hard',
      bgColor: 'bg-red-100',
    },
  };

  const difficulty = difficultyConfig[quest.difficulty];

  const objectiveList =
    Array.isArray(quest.objectives) || !quest.objectives
      ? quest.objectives || []
      : (() => {
          try {
            const parsed = JSON.parse(quest.objectives);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            console.error('Unable to parse objectives', error);
            return [] as string[];
          }
        })();

  const cardContent = (
    <div className="h-full p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">{quest.title}</h3>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap ${difficulty.bgColor} ${difficulty.color}`}
        >
          {difficulty.label}
        </span>
      </div>

      <div className="mb-4">
        <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
          {quest.leanConcept}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quest.description}</p>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Objectives:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          {objectiveList.slice(0, 2).map((obj, idx) => (
            <li key={obj + idx} className="flex items-start">
              <span className="mr-2">•</span>
              <span className="line-clamp-1">{obj}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-amber-600">⭐</span>
            <span className="text-sm font-semibold text-gray-700">{quest.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">⏱️</span>
            <span className="text-sm text-gray-600">{quest.timeEstimate} min</span>
          </div>
        </div>

        {quest.skillUnlock && (
          <div className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">🔓 Unlock</div>
        )}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(quest)}
        className="text-left"
        aria-label={`View quest ${quest.title}`}
      >
        {cardContent}
      </button>
    );
  }

  return <Link href={`/quests/${quest.id}`}>{cardContent}</Link>;
}
