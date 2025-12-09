"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { QuestCard } from '@/components/game/quest-card';
import type { Quest } from '@/types/quest';

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const response = await api.get('/api/quests');
        setQuests(response.data as Quest[]);
      } catch (err) {
        console.error('Unable to load quests', err);
        setError('Nepodařilo se načíst úkoly.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuests();
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Úkoly</h1>
        <p className="text-sm text-gray-600">Vyberte si quest a začněte sbírat XP.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Načítám dostupné úkoly...</span>
        </div>
      ) : error ? (
        <Card title="Chyba" description={error} />
      ) : quests.length === 0 ? (
        <Card title="Žádné úkoly" description="Momentálně nejsou k dispozici žádné aktivní questy." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}
    </div>
  );
}
