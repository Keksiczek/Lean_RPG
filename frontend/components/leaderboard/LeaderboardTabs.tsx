'use client';

interface LeaderboardTabsProps {
  active: 'all' | 'week' | 'month';
  onChange: (tab: 'all' | 'week' | 'month') => void;
}

export default function LeaderboardTabs({ active, onChange }: LeaderboardTabsProps) {
  const tabs: { id: 'all' | 'week' | 'month'; label: string; icon: string }[] = [
    { id: 'all', label: 'All Time', icon: '📊' },
    { id: 'week', label: 'This Week', icon: '⚡' },
    { id: 'month', label: 'This Month', icon: '📈' },
  ];

  return (
    <div className="flex gap-2" role="tablist" aria-label="Leaderboard timeframe">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            active === tab.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
          role="tab"
          aria-selected={active === tab.id}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}
