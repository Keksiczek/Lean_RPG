'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Flame, Loader2, Lock, Sparkles, Zap } from 'lucide-react';
import {
  activateSkill,
  deactivateSkill,
  fetchMySkills,
  fetchProgressionDashboard,
  fetchSkillTree,
} from '@/lib/api/skills';
import type { PlayerSkill, SkillProgression, SkillTreeNode } from '@/types/api';

interface SkillState {
  skill: SkillTreeNode;
  playerSkill?: PlayerSkill;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillTreeNode[]>([]);
  const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([]);
  const [progression, setProgression] = useState<SkillProgression | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningSkill, setActioningSkill] = useState<number | null>(null);

  const tierGroups = useMemo(() => {
    const groups: Record<number, SkillState[]> = {};
    skills.forEach((skill) => {
      const playerSkill = playerSkills.find((ps) => ps.skillId === skill.id);
      const tier = skill.tier;
      groups[tier] = groups[tier] || [];
      groups[tier].push({ skill, playerSkill });
    });
    return groups;
  }, [skills, playerSkills]);

  useEffect(() => {
    void reloadData();
  }, []);

  async function reloadData() {
    setLoading(true);
    setError(null);
    try {
      const [tree, mySkills, dashboard] = await Promise.all([
        fetchSkillTree(),
        fetchMySkills(),
        fetchProgressionDashboard(),
      ]);

      setSkills(tree);
      setPlayerSkills(mySkills.skills);
      setProgression(dashboard);
    } catch (fetchError) {
      setError('Unable to load skills right now. Please try again later.');
      console.error(fetchError);
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(skillId: number) {
    try {
      setActioningSkill(skillId);
      await activateSkill(skillId);
      await reloadData();
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : 'Failed to activate skill');
    } finally {
      setActioningSkill(null);
    }
  }

  async function handleDeactivate(skillId: number) {
    try {
      setActioningSkill(skillId);
      await deactivateSkill(skillId);
      await reloadData();
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : 'Failed to deactivate skill');
    } finally {
      setActioningSkill(null);
    }
  }

  function renderSkillCard(state: SkillState) {
    const { skill, playerSkill } = state;
    const unlocked = playerSkill?.isUnlocked ?? false;
    const active = playerSkill?.isActive ?? false;
    const meetsPrereqs = skill.requiresSkills.length === 0 || skill.requiresSkills.every((id) =>
      playerSkills.some((ps) => ps.skillId === id && ps.isUnlocked)
    );
    const xpRemaining = progression ? Math.max(0, skill.requiresXp - progression.totalXp) : skill.requiresXp;

    const canActivate = unlocked && !active;
    const canDeactivate = !!active;

    return (
      <div
        key={skill.id}
        className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 shadow-md space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${skill.color || '#1e293b'}33` }}>
            {skill.icon || '⭐'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
              {active && <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full">Active</span>}
              {unlocked && !active && <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full">Unlocked</span>}
            </div>
            <p className="text-sm text-slate-300">{skill.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="inline-flex items-center gap-1"><Zap className="h-4 w-4 text-amber-400" />{skill.requiresXp} XP</span>
          <span className="inline-flex items-center gap-1"><Sparkles className="h-4 w-4 text-indigo-400" />Tier {skill.tier}</span>
          {!meetsPrereqs && (
            <span className="inline-flex items-center gap-1 text-rose-300"><Lock className="h-4 w-4" />Needs prerequisites</span>
          )}
          {!unlocked && xpRemaining > 0 && (
            <span className="inline-flex items-center gap-1 text-orange-200"><Flame className="h-4 w-4" />{xpRemaining} XP to unlock</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white disabled:bg-slate-600 disabled:text-slate-300"
            onClick={() => handleActivate(skill.id)}
            disabled={!canActivate || !meetsPrereqs || xpRemaining > 0 || actioningSkill === skill.id}
          >
            {actioningSkill === skill.id && canActivate ? 'Activating...' : 'Activate'}
          </button>
          <button
            className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white disabled:bg-slate-800 disabled:text-slate-400"
            onClick={() => handleDeactivate(skill.id)}
            disabled={!canDeactivate || actioningSkill === skill.id}
          >
            {actioningSkill === skill.id && canDeactivate ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-blue-300">
            <Sparkles className="h-5 w-5" />
            <span className="uppercase tracking-wide text-xs">Skill Tree</span>
          </div>
          <h1 className="text-4xl font-bold">Lean Mastery Progression</h1>
          <p className="text-slate-300 max-w-3xl">Unlock Lean methodologies as you play. Activate up to three skills for bonuses and keep progressing toward Tier 3 mastery.</p>
        </header>

        {progression && (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Current Tier</p>
                <div className="flex items-center gap-2 text-2xl font-semibold">
                  <span>Tier {progression.currentTier}</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Total XP</p>
                <p className="text-2xl font-semibold text-white">{progression.totalXp} XP</p>
                <p className="text-sm text-slate-400">Active skills: {progression.activeSkillCount} / 3</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Progress to next tier</span>
                <span>{Math.round((progression.tierProgress ?? 0) * 100)}%</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500"
                  style={{ width: `${Math.min(100, Math.round((progression.tierProgress ?? 0) * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-300">{progression.xpToNextTier ?? 0} XP to next tier</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-100 px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-300 flex flex-col gap-3 items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p>Loading skill tree...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(tierGroups)
              .map((tier) => Number(tier))
              .sort((a, b) => a - b)
              .map((tier) => (
                <section key={tier} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">Tier {tier}</span>
                    <span className="text-sm text-slate-400">{tierGroups[tier]?.length || 0} skills</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tierGroups[tier]?.map((state) => renderSkillCard(state))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
