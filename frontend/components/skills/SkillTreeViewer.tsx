"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlayerSkillState, SkillTreeNode } from "@/types/skills";

interface SkillTreeViewerProps {
  onSkillClick?: (skill: SkillTreeNode) => void;
}

export function SkillTreeViewer({ onSkillClick }: SkillTreeViewerProps) {
  const [skills, setSkills] = useState<SkillTreeNode[]>([]);
  const [userSkills, setUserSkills] = useState<PlayerSkillState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchSkills() {
      try {
        setLoading(true);
        setError(null);

        const [treeRes, mySkillsRes] = await Promise.all([
          fetch("/api/skills/tree"),
          fetch("/api/skills/my-skills"),
        ]);

        if (!treeRes.ok || !mySkillsRes.ok) {
          throw new Error("Failed to fetch skill data");
        }

        const treeData: SkillTreeNode[] = await treeRes.json();
        const mySkillsData = await mySkillsRes.json();

        if (mounted) {
          setSkills(treeData);
          setUserSkills(mySkillsData.skills || []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSkills();
    return () => {
      mounted = false;
    };
  }, []);

  const skillsByTier = useMemo(() => {
    return skills.reduce<Record<number, SkillTreeNode[]>>((acc, skill) => {
      acc[skill.tier] = acc[skill.tier] || [];
      acc[skill.tier].push(skill);
      return acc;
    }, {});
  }, [skills]);

  if (loading) {
    return <div className="rounded-lg bg-white p-4 shadow-sm">Loading skill tree...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p className="font-semibold">Unable to load skills</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!skills.length) {
    return <div className="rounded-lg bg-white p-4 shadow-sm">No skills available.</div>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(skillsByTier)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tier, tierSkills]) => (
          <div key={tier} className="rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Tier {tier}</p>
                <h3 className="text-lg font-semibold text-gray-900">Unlocked skills</h3>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {tierSkills.length} items
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tierSkills.map((skill) => {
                const state = userSkills.find((item) => item.skillId === skill.id) || skill.userState;
                const unlocked = state?.isUnlocked;
                const active = state?.isActive;
                return (
                  <button
                    key={skill.id}
                    onClick={() => onSkillClick?.(skill)}
                    className={`flex flex-col items-start rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                      unlocked ? "border-indigo-200" : "border-gray-200"
                    } ${active ? "ring-2 ring-indigo-400" : ""}`}
                  >
                    <div className="mb-2 flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{skill.icon || "⭐"}</span>
                        <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                      </div>
                      {active && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-sm text-gray-600">{skill.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-2 py-1">{skill.category}</span>
                      <span className="rounded bg-gray-100 px-2 py-1">Requires {skill.requiresXp} XP</span>
                      {skill.badgeUnlock && (
                        <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">
                          Badge: {skill.badgeUnlock}
                        </span>
                      )}
                      {unlocked ? (
                        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">Unlocked</span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-1">Locked</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
}
