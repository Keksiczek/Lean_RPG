'use client';

import Link from 'next/link';
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  Flame,
  Trophy,
  UserRound,
} from 'lucide-react';
import type { PlayerStats, User } from '@/types/api';

interface PlayerProfileContentProps {
  player: User;
  stats: PlayerStats;
}

export default function PlayerProfileContent({ player, stats }: PlayerProfileContentProps) {
  const trendData = stats.xpTrend && stats.xpTrend.length
    ? stats.xpTrend
    : Array.from({ length: 10 }, (_, idx) => ({
        date: `Day ${idx + 1}`,
        xp: Math.max(10, player.totalXp / 10 - idx * 25),
      }));

  const maxXp = Math.max(...trendData.map((point) => point.xp), 1);
  const conceptEntries = Object.entries(stats.concepts ?? {});
  const achievements = stats.achievements?.length
    ? stats.achievements
    : ['Continuous Improver', 'Kaizen Champion', 'Collaboration Pro'];
  const recentSubmissions = stats.recentSubmissions ?? [];

  return (
    <div className="space-y-8">
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Leaderboard
      </Link>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white shadow-lg shadow-blue-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl">
            <UserRound className="w-12 h-12" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-4xl font-bold">{player.name}</h1>
            <p className="text-blue-100">Level {player.level}</p>
            <div className="flex flex-wrap gap-3 text-sm text-blue-50">
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                <Award className="w-4 h-4" /> {player.role}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                <Activity className="w-4 h-4" /> Joined {new Date(player.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold">{player.totalXp.toLocaleString()}</p>
            <p className="text-blue-100">Total XP</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 space-y-2">
          <p className="text-slate-400 text-sm">Role</p>
          <p className="text-2xl font-bold text-white capitalize">{player.role}</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 space-y-2">
          <p className="text-slate-400 text-sm">Member Since</p>
          <p className="text-white">{new Date(player.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 space-y-2">
          <p className="text-slate-400 text-sm">Submissions</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.submissions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-2 text-white font-semibold mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> Completed Quests
          </div>
          <p className="text-3xl font-bold text-green-400">{stats.completedQuests}</p>
          <p className="text-slate-400 text-sm">All-time progress</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-2 text-white font-semibold mb-2">
            <Flame className="w-5 h-5 text-orange-400" /> Recent Activity
          </div>
          <p className="text-3xl font-bold text-orange-300">{stats.submissions}</p>
          <p className="text-slate-400 text-sm">Total submissions</p>
        </div>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-2 text-white font-semibold mb-2">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Level Progress
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              style={{ width: `${Math.min(100, (player.level / 50) * 100)}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm mt-2">Level {player.level} of 50</p>
        </div>
      </div>

      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">XP Progress (Last 30 Days)</h2>
        <div className="h-64 bg-slate-800 rounded-lg p-4 flex items-end gap-2 overflow-x-auto">
          {trendData.map((point) => (
            <div key={point.date} className="flex-1 min-w-[12px] text-center">
              <div
                className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                style={{ height: `${(point.xp / maxXp) * 100}%`, minHeight: '12px' }}
              />
              <p className="text-xs text-slate-400 mt-2">{point.date}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Lean Concepts Mastery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(conceptEntries.length ? conceptEntries : Object.entries({
            '5S': 67,
            Kaizen: 72,
            'Problem Solving': 64,
            'Standard Work': 70,
          })).map(([concept, score]) => (
            <div key={concept} className="bg-slate-800 rounded p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-300 text-sm">{concept}</p>
                <span className="text-white font-semibold">{score}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min(Number(score) || 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <CheckCircle2 className="w-5 h-5 text-green-400" /> Completed Quests
          </div>
          {stats.completedQuests === 0 ? (
            <p className="text-slate-400">No quests completed yet.</p>
          ) : (
            <ul className="space-y-2 text-slate-200 text-sm">
              {Array.from({ length: Math.min(stats.completedQuests, 5) }).map((_, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between bg-slate-800 rounded p-3"
                >
                  <span>Quest #{idx + 1}</span>
                  <span className="text-green-400">Completed</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Activity className="w-5 h-5 text-blue-400" /> Recent Submissions
          </div>
          {recentSubmissions.length === 0 ? (
            <p className="text-slate-400">No recent submissions.</p>
          ) : (
            <ul className="space-y-2 text-slate-200 text-sm">
              {recentSubmissions.slice(0, 5).map((submission) => (
                <li
                  key={submission.id}
                  className="flex items-center justify-between bg-slate-800 rounded p-3"
                >
                  <div>
                    <p className="font-semibold">{submission.questTitle}</p>
                    <p className="text-xs text-slate-400">{submission.completedAt ?? 'Recently'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-semibold">{submission.xpGain ?? 0} XP</p>
                    <p className="text-xs text-slate-400 capitalize">{submission.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-3">
          <Award className="w-5 h-5 text-amber-400" /> Achievement Badges
        </div>
        <div className="flex flex-wrap gap-3">
          {achievements.map((achievement) => (
            <span
              key={achievement}
              className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-100 px-3 py-2 rounded-lg"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              {achievement}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
