import type { GembaNpc, GembaProblem } from '@/lib/api/gemba';

type Props = {
  npc: GembaNpc;
  problems: GembaProblem[];
  onAccept: (problem: GembaProblem) => void;
};

export function NPCDialog({ npc, problems, onAccept }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-gray-500">{npc.role}</p>
          <h4 className="text-lg font-semibold text-gray-900">{npc.name}</h4>
          <p className="text-sm text-gray-600">{npc.greeting}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Lvl {npc.level}</span>
      </div>
      <div className="space-y-2">
        {problems.map((problem) => (
          <div key={problem.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{problem.title}</p>
                <p className="text-xs text-gray-600">Concept: {problem.leanConcept}</p>
                <p className="text-xs text-gray-600">Reward: {problem.baseXp} XP</p>
              </div>
              <button
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                onClick={() => onAccept(problem)}
              >
                Accept
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-700">{problem.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
