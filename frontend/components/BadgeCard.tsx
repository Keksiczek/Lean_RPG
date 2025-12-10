import clsx from "clsx";
import type { BadgeDto } from "./BadgeShowcase";

export function BadgeCard({ badge, unlocked }: { badge: BadgeDto; unlocked?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-4 shadow-sm",
        unlocked ? "border-green-400" : "border-slate-200",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl" aria-hidden>
          {badge.icon ?? "🎖️"}
        </div>
        <div>
          <p className="font-semibold">{badge.name}</p>
          <p className="text-sm text-slate-500">{badge.description}</p>
        </div>
      </div>
      {unlocked && badge.unlockedAt && (
        <p className="mt-2 text-xs text-green-600">Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}</p>
      )}
      {!unlocked && <p className="mt-2 text-xs text-slate-500">Progress required to unlock</p>}
    </div>
  );
}
