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
      } ${locked ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
      disabled={locked}
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
          {locked ? (
            <span className="mt-1 inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
              Unlock at level {area.unlockAtLevel}
            </span>
          ) : (
            <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              Available
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
