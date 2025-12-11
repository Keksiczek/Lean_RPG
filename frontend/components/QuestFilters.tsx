'use client';

import { Difficulty, LeanConcept } from '@/types/quest';

interface QuestFiltersProps {
  selectedDifficulty: Difficulty | 'all';
  selectedConcept: LeanConcept | 'all';
  onDifficultyChange: (difficulty: Difficulty | 'all') => void;
  onConceptChange: (concept: LeanConcept | 'all') => void;
}

const DIFFICULTIES: Array<Difficulty | 'all'> = ['all', 'easy', 'medium', 'hard'];
const CONCEPTS: Array<LeanConcept | 'all'> = ['all', '5S', 'Kaizen', 'ProblemSolving', 'StandardWork', 'Gemba'];

export function QuestFilters({
  selectedDifficulty,
  selectedConcept,
  onDifficultyChange,
  onConceptChange,
}: QuestFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Difficulty
          </label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                onClick={() => onDifficultyChange(diff)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Lean Concept Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Lean Concept
          </label>
          <div className="flex flex-wrap gap-2">
            {CONCEPTS.map((concept) => (
              <button
                key={concept}
                onClick={() => onConceptChange(concept)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedConcept === concept
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {concept === 'all' ? 'All Topics' : concept}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
