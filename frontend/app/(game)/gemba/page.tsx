'use client';

import { useEffect, useMemo, useState } from 'react';
import { GembaMap } from '@/components/gemba/GembaMap';
import { NPCDialog } from '@/components/gemba/NPCDialog';
import { Card } from '@/components/ui/card';
import type {
  BadgeSummary,
  DailyChallenge,
  GembaAreaSummary,
  GembaNpc,
  GembaProblem,
  IdeaSubmission,
  LeaderboardSummary,
} from '@/lib/api/gemba';
import {
  fetchAreas,
  fetchAreaDetail,
  fetchBadges,
  fetchDailyChallenge,
  fetchIdeas,
  fetchLeaderboard,
  startQuest,
  submitIdea,
  submitQuest,
} from '@/lib/api/gemba';
import { useAuth } from '@/lib/auth-context';

export default function GembaPage() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<GembaAreaSummary[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [areaDetail, setAreaDetail] = useState<
    (GembaAreaSummary & { npcs: GembaNpc[]; problems: GembaProblem[] }) | null
  >(null);

  const [activeProblem, setActiveProblem] = useState<GembaProblem | null>(null);
  const [questFeedback, setQuestFeedback] = useState<string | null>(null);
  const [questResult, setQuestResult] = useState<{ xpGain?: number; conceptGain?: number } | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSummary | null>(null);
  const [badges, setBadges] = useState<{ available: BadgeSummary[]; earned: BadgeSummary[] } | null>(null);
  const [ideas, setIdeas] = useState<IdeaSubmission[]>([]);
  const [ideaFeedback, setIdeaFeedback] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState({
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: '',
    rootCause: '',
    solutionId: 0,
  });
  const [ideaForm, setIdeaForm] = useState({
    title: '',
    problemContext: '',
    proposedSolution: '',
    impact: '',
  });

  useEffect(() => {
    const loadAreas = async () => {
      setAreaError(null);
      try {
        const data = await fetchAreas();
        setAreas(data);
        const firstAvailable = data.find((area) => !area.locked) ?? data[0];
        if (firstAvailable) {
          handleSelectArea(firstAvailable.id);
        }
      } catch (error) {
        setAreaError((error as Error).message);
      }
    };
    const loadEngagement = async () => {
      try {
        const [challenge, leaderboardResponse, badgeResponse, userIdeas] = await Promise.all([
          fetchDailyChallenge(),
          fetchLeaderboard(),
          fetchBadges(),
          fetchIdeas(),
        ]);
        setDailyChallenge(challenge);
        setLeaderboard(leaderboardResponse);
        setBadges(badgeResponse);
        setIdeas(userIdeas);
      } catch (error) {
        setIdeaFeedback((error as Error).message);
      }
    };

    loadAreas();
    loadEngagement();
  }, []);

  const handleSelectArea = async (areaId: number) => {
    setAreaLoading(true);
    setQuestFeedback(null);
    setQuestResult(null);
    try {
      const detail = await fetchAreaDetail(areaId);
      setAreaDetail(detail);
      setSelectedAreaId(areaId);
      setActiveProblem(null);
    } catch (error) {
      setAreaError((error as Error).message);
    } finally {
      setAreaLoading(false);
    }
  };

  const handleAccept = async (problem: GembaProblem) => {
    setQuestFeedback(null);
    setQuestResult(null);
    try {
      await startQuest(problem.questId);
      setActiveProblem(problem);
      setAnalysis({
        why1: '',
        why2: '',
        why3: '',
        why4: '',
        why5: '',
        rootCause: problem.rootCause,
        solutionId: problem.solutions[0]?.id ?? 0,
      });
    } catch (error) {
      setQuestFeedback((error as Error).message);
    }
  };

  const handleSubmit = async () => {
    if (!activeProblem) return;
    try {
      const { evaluation } = await submitQuest(activeProblem.questId, analysis);
      setQuestFeedback(evaluation.feedback);
      setQuestResult({ xpGain: evaluation.xpReward, conceptGain: evaluation.conceptMasteryGain });
    } catch (error) {
      setQuestFeedback((error as Error).message);
    }
  };

  const handleIdeaSubmit = async () => {
    try {
      const saved = await submitIdea(ideaForm);
      setIdeaFeedback('Idea submitted! A CI specialist will review it.');
      setIdeas((prev) => [saved, ...prev]);
      setIdeaForm({ title: '', problemContext: '', proposedSolution: '', impact: '' });
    } catch (error) {
      setIdeaFeedback((error as Error).message);
    }
  };

  const selectedNpc = useMemo(() => {
    if (!areaDetail || !activeProblem) return null;
    return areaDetail.npcs.find((npc) => npc.id === activeProblem.npcId) ?? null;
  }, [areaDetail, activeProblem]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title={user ? `Hi ${user.name}` : 'Lean RPG'}
          description="Track your level, XP, and invite teammates to explore."
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-3xl font-bold text-blue-700">{user?.level ?? 1}</p>
            <p className="text-xs text-gray-500">XP: {user?.totalXp ?? user?.xp ?? 0}</p>
          </div>
        </Card>

        <Card title="Daily challenge" description="Quick wins for everyone on shift.">
          {dailyChallenge ? (
            <div className="space-y-1 text-sm text-gray-800">
              <p className="font-semibold">{dailyChallenge.title}</p>
              <p className="text-gray-600">{dailyChallenge.description}</p>
              <p className="text-xs text-emerald-700">Reward: +{dailyChallenge.rewardXp} XP · {dailyChallenge.rewardPoints} pts</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Loading challenge...</p>
          )}
        </Card>

        <Card title="Leaderboards" description="Employees + CI specialists side by side.">
          {leaderboard ? (
            <div className="space-y-2 text-sm text-gray-800">
              {leaderboard.global.slice(0, 3).map((entry, index) => (
                <div key={entry.userId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {index + 1}. {entry.name}
                    </p>
                    <p className="text-xs text-gray-600">{entry.team} · L{entry.level}</p>
                  </div>
                  <p className="text-xs font-semibold text-blue-700">{entry.xp} XP</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Loading leaderboard...</p>
          )}
        </Card>

        <Card title="Badges" description="Earned vs. available achievements.">
          {badges ? (
            <div className="space-y-2 text-sm text-gray-800">
              <p className="font-semibold text-emerald-700">Earned ({badges.earned.length})</p>
              <div className="flex flex-wrap gap-1">
                {badges.earned.map((badge) => (
                  <span key={badge.id} className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    {badge.icon} {badge.name}
                  </span>
                ))}
                {badges.earned.length === 0 && <span className="text-xs text-gray-500">Start solving to earn badges.</span>}
              </div>
              <p className="text-xs text-gray-600">Available: {badges.available.length}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Loading badges...</p>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-7/12">
          <Card title="Gemba Map" description="Select an area to start your walk.">
            {areaError && <p className="text-sm text-red-600">{areaError}</p>}
            {areas.length > 0 ? (
              <GembaMap areas={areas} onSelect={handleSelectArea} selectedId={selectedAreaId ?? undefined} />
            ) : (
              <p className="text-sm text-gray-600">Loading areas...</p>
            )}
          </Card>
        </div>
        <div className="lg:w-5/12">
          <Card
            title="Area intel"
            description={
              areaDetail
                ? `${areaDetail.name} — Level ${areaDetail.levelRequired}+ (${areaDetail.problems.length} problems)`
                : 'Choose an area to see NPCs and issues.'
            }
          >
            {areaLoading && <p className="text-sm text-gray-500">Loading area...</p>}
            {areaDetail && (
              <div className="space-y-4">
                {areaDetail.npcs.map((npc) => (
                  <NPCDialog
                    key={npc.id}
                    npc={npc}
                    problems={areaDetail.problems.filter((p) => p.npcId === npc.id)}
                    onAccept={handleAccept}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Submit an idea"
          description="Employees share improvement ideas, CI specialists review them."
        >
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border border-gray-200 p-2 text-sm"
              placeholder="Title"
              value={ideaForm.title}
              onChange={(e) => setIdeaForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <textarea
              className="w-full rounded-lg border border-gray-200 p-2 text-sm"
              rows={2}
              placeholder="What problem do you see?"
              value={ideaForm.problemContext}
              onChange={(e) =>
                setIdeaForm((prev) => ({ ...prev, problemContext: e.target.value }))
              }
            />
            <textarea
              className="w-full rounded-lg border border-gray-200 p-2 text-sm"
              rows={2}
              placeholder="Proposed solution"
              value={ideaForm.proposedSolution}
              onChange={(e) =>
                setIdeaForm((prev) => ({ ...prev, proposedSolution: e.target.value }))
              }
            />
            <input
              className="w-full rounded-lg border border-gray-200 p-2 text-sm"
              placeholder="Impact (time saved, quality boost, cost)"
              value={ideaForm.impact}
              onChange={(e) => setIdeaForm((prev) => ({ ...prev, impact: e.target.value }))}
            />
            <button
              className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              onClick={handleIdeaSubmit}
            >
              Share with CI team
            </button>
            {ideaFeedback && <p className="text-xs text-emerald-700">{ideaFeedback}</p>}
          </div>
        </Card>

        <Card title="Your recent ideas" description="See the queue before a specialist reviews it.">
          {ideas.length ? (
            <div className="space-y-2 text-sm text-gray-800">
              {ideas.slice(0, 4).map((idea) => (
                <div key={idea.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="font-semibold text-gray-900">{idea.title}</p>
                  <p className="text-xs text-gray-600">{idea.problemContext}</p>
                  <p className="text-xs text-gray-500">Status: {idea.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Submit your first idea to see it here.</p>
          )}
        </Card>
      </div>

      <Card
        title="Quest workspace"
        description={
          activeProblem
            ? `${activeProblem.title} · Concept: ${activeProblem.leanConcept} · Reward: ${activeProblem.baseXp} XP`
            : 'Accept a problem from an NPC to begin analysis.'
        }
      >
        {activeProblem ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800">5 Why Analysis</h4>
              {['why1', 'why2', 'why3', 'why4', 'why5'].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">{key.toUpperCase()}</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                    rows={2}
                    value={(analysis as any)[key]}
                    onChange={(e) => setAnalysis((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Root cause</label>
                <input
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={analysis.rootCause}
                  onChange={(e) => setAnalysis((prev) => ({ ...prev, rootCause: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">Choose solution</p>
                {activeProblem.solutions.map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 shadow-sm">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={analysis.solutionId === option.id}
                      onChange={() => setAnalysis((prev) => ({ ...prev, solutionId: option.id }))}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{option.title}</p>
                      <p className="text-xs text-gray-600">Impact: {option.impact}</p>
                      <p className="text-xs text-gray-600">Feasibility: {option.feasibility}</p>
                      {option.recommended && (
                        <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                          Recommended
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              <button
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                onClick={handleSubmit}
              >
                Submit analysis
              </button>
              {questFeedback && (
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-semibold">Feedback</p>
                  <p>{questFeedback}</p>
                  {questResult && (
                    <p className="mt-1 text-xs text-blue-700">
                      +{questResult.xpGain ?? 0} XP · Concept mastery +{questResult.conceptGain ?? 0}
                    </p>
                  )}
                </div>
              )}
              {selectedNpc && (
                <div className="rounded-lg border border-gray-100 p-3 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900">{selectedNpc.name} says</p>
                  <p className="text-gray-600">{selectedNpc.dialogue.complete}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Awaiting your next Gemba challenge.</p>
        )}
      </Card>
    </div>
  );
}
