import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Quest } from '@/types/quest';

export function QuestCard({ quest }: { quest: Quest }) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
            <p className="text-sm text-gray-600">{quest.briefText || quest.description}</p>
          </div>
          <Badge>{quest.baseXp} XP</Badge>
        </div>
        {quest.leanConcept ? (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-medium">Lean koncept:</span>
            <Badge variant="outline">{quest.leanConcept}</Badge>
          </div>
        ) : null}
        <div className="flex justify-end">
          <Link
            href={`/quests/${quest.id}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            Start quest
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
