"use client";

import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title={`Vítejte, ${user?.name ?? 'hrdinové'}`} description="Základní přehled vašeho hrdiny.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-600">Level</p>
            <p className="text-3xl font-bold text-primary">{level}</p>
            <p className="text-xs text-blue-600">Rostete s každým úkolem</p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-4">
            <p className="text-sm text-indigo-600">Zkušenosti</p>
            <p className="text-3xl font-bold text-indigo-700">{xp}</p>
            <p className="text-xs text-indigo-600">Sbírejte XP plněním questů</p>
          </div>
        </div>
      </Card>
      <Card title="Co je nového?" description="Brzy přidáme questy a lokace. Zatím si užijte nový dashboard." />
    </div>
  );
}
