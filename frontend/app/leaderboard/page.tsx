'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Shield, Trophy, Users } from 'lucide-react';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import LeaderboardTabs from '@/components/leaderboard/LeaderboardTabs';
import Pagination from '@/components/common/Pagination';
import SearchBar from '@/components/common/SearchBar';
import { fetchLeaderboard } from '@/lib/api/leaderboard';
import type { LeaderboardEntry } from '@/types/api';

const PAGE_SIZE = 20;

type Timeframe = 'all' | 'week' | 'month';

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [timeframe, search]);

  useEffect(() => {
    let isCancelled = false;
    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchLeaderboard({ timeframe, page, search, limit: PAGE_SIZE });
        if (isCancelled) return;
        setPlayers(response.players);
        setTotal(response.total);
      } catch (fetchError) {
        if (!isCancelled) {
          setError('Unable to load leaderboard. Please try again later.');
          console.error(fetchError);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void loadLeaderboard();

    return () => {
      isCancelled = true;
    };
  }, [timeframe, page, search]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400">
              <Shield className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wide">Elite Rankings</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">🏆 Leaderboard</h1>
            <p className="text-slate-400">See who&apos;s leading the CI revolution</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-slate-200">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="font-semibold">Top Performer</p>
              <p className="text-sm text-slate-400">Updated in real time</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <SearchBar
            placeholder="Search players..."
            value={search}
            onChange={setSearch}
          />
          <LeaderboardTabs
            active={timeframe}
            onChange={setTimeframe}
          />
        </div>

        <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 flex flex-wrap items-center gap-4 text-slate-200">
          <div className="inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>{total.toLocaleString()} players</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Sorted by XP</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-300 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <p>Loading leaderboard...</p>
          </div>
        ) : (
          <>
            <LeaderboardTable players={players} />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </main>
  );
}

export const dynamic = 'force-dynamic';
