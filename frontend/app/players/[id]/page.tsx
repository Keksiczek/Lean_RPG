import { notFound } from 'next/navigation';
import PlayerProfileContent from '@/components/players/PlayerProfileContent';
import { fetchPlayer, fetchPlayerStats } from '@/lib/api/players';

interface PlayerProfilePageProps {
  params: {
    id: string;
  };
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const userId = Number.parseInt(params.id, 10);

  if (Number.isNaN(userId)) {
    notFound();
  }

  try {
    const [player, stats] = await Promise.all([
      fetchPlayer(userId),
      fetchPlayerStats(userId),
    ]);

    if (!player) {
      notFound();
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <PlayerProfileContent player={player} stats={stats} />
        </div>
      </main>
    );
  } catch (error) {
    console.error('Failed to fetch player:', error);
    notFound();
  }
}

export const dynamic = 'force-dynamic';
