import type { GembaAreaSummary } from '@/lib/api/gemba';

type Props = {
  area: GembaAreaSummary;
  selected?: boolean;
  onSelect: (areaId: number) => void;
};

export function AreaCard({ area, selected, onSelect }: Props) {
  const locked = area.locked;

  return (
    <button
      onClick={() => onSelect(area.id)}
      className={`relative w-full rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      } ${locked ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Level {area.levelRequired}+</p>
          <h3 className="text-lg font-semibold" style={{ color: locked ? undefined : area.color }}>
            {area.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{area.description}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-gray-700">{area.activeProblems} problems</p>
          <div className="mt-1 inline-flex flex-col items-end gap-1">
            {locked ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                Preview only · Unlock at level {area.unlockAtLevel}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                Available to explore
              </span>
            )}
            {area.audience === 'specialist' && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-800">
                CI specialist zone
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
