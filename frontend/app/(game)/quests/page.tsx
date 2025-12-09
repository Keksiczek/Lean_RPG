"use client";

import { useEffect, useState } from 'react';
import { Quest, fetchQuests } from '@/lib/quests';
import { QuestCard } from '@/components/game/quest-card';
import { Loader2 } from 'lucide-react';

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuests = async () => {
      try {
        setLoading(true);
        const data = await fetchQuests();
        setQuests(data);
      } catch (err) {
        console.error('Failed to load quests:', err);
        setError('Nepodařilo se načíst questy. Zkuste to později.');
      } finally {
        setLoading(false);
      }
    };

    loadQuests();
  }, []);

  const handleStartQuest = (questId: number) => {
    console.log(`Starting quest ${questId}`);
    // TODO: Later - navigace na quest detail nebo start dialog
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span>Načítám úkoly...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-gray-700">
        <p>Zatím nejsou k dispozici žádné úkoly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Úkoly (Questy)</h1>
        <p className="text-gray-600 mt-1">Vyber si úkol a začni si získávat XP a dovednosti.</p>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onStart={handleStartQuest}
          />
        ))}
      </div>
    </div>
  );
}
