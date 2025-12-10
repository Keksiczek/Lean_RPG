'use client';

import Link from 'next/link';
import { Sparkles, UserRound } from 'lucide-react';
import type { LeaderboardEntry } from '@/types/api';

interface LeaderboardTableProps {
  players: LeaderboardEntry[];
}

function medalEmoji(rank: number) {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return null;
  }
}

const rankColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-400';
  if (rank === 2) return 'text-slate-200';
  if (rank === 3) return 'text-amber-600';
  return 'text-white';
};

export default function LeaderboardTable({ players }: LeaderboardTableProps) {
  if (!players.length) {
    return (
      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-8 text-center text-slate-300">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-400" />
        <p>No players found for this timeframe.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-700/30 border border-slate-600 rounded-lg overflow-hidden shadow-xl shadow-blue-900/30">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800/50 border-b border-slate-600">
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rank</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Player</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Level</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">XP</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Submissions</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => {
            const rank = player.rank ?? idx + 1;
            return (
              <tr
                key={player.id}
                className="border-b border-slate-700/80 hover:bg-slate-700/50 transition"
              >
                <td className={`px-6 py-4 font-bold ${rankColor(rank)}`}>
                  {medalEmoji(rank) || `#${rank}`}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-200">
                      <UserRound className="w-5 h-5" />
                    </div>
                    <div>
                      <Link
                        href={`/players/${player.id}`}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        {player.name}
                      </Link>
                      <p className="text-xs text-slate-400">{player.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-yellow-400 font-semibold">Lv. {player.level}</td>
                <td className="px-6 py-4 text-right text-green-400 font-semibold">
                  {player.totalXp.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right text-slate-300">
                  {player.submissionsCount ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
