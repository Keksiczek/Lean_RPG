'use client';

import { useState, useMemo } from 'react';
import { useQuests } from '@/hooks/useQuests';
import { QuestCard } from '@/components/QuestCard';
import { QuestFilters } from '@/components/QuestFilters';
import { Quest, Difficulty, LeanConcept } from '@/types/quest';
import { QuestDetailModal } from '@/components/QuestDetailModal';

export default function QuestsPage() {
  const { data: quests = [], isLoading, error } = useQuests();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedConcept, setSelectedConcept] = useState<LeanConcept | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredQuests = useMemo(() => {
    return quests.filter((quest: Quest) => {
      const matchesDifficulty = selectedDifficulty === 'all' || quest.difficulty === selectedDifficulty;
      const matchesConcept = selectedConcept === 'all' || quest.leanConcept === selectedConcept;
      const matchesSearch =
        quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDifficulty && matchesConcept && matchesSearch;
    });
  }, [quests, selectedDifficulty, selectedConcept, searchTerm]);

  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="text-lg font-bold mb-2">Failed to load quests</p>
          <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 Quests</h1>
          <p className="text-gray-600">
            Choose a quest and start learning Lean! ({filteredQuests.length} available)
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search quests by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Filters */}
        <QuestFilters
          selectedDifficulty={selectedDifficulty}
          selectedConcept={selectedConcept}
          onDifficultyChange={setSelectedDifficulty}
          onConceptChange={setSelectedConcept}
        />

        {/* Quests Grid */}
        {filteredQuests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuests.map((quest: Quest) => (
              <QuestCard key={quest.id} quest={quest} onSelect={handleQuestClick} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No quests found matching your criteria</p>
          </div>
        )}

        <QuestDetailModal
          quest={selectedQuest}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedQuest(null);
          }}
        />
      </div>
    </div>
  );
}
