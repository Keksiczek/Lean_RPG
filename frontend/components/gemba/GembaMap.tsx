import type { GembaAreaSummary } from '@/lib/api/gemba';
import { AreaCard } from './AreaCard';

type Props = {
  areas: GembaAreaSummary[];
  onSelect: (areaId: number) => void;
  selectedId?: number;
};

export function GembaMap({ areas, onSelect, selectedId }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {areas.map((area) => (
        <AreaCard key={area.id} area={area} selected={selectedId === area.id} onSelect={onSelect} />
      ))}
    </div>
  );
}
