'use client';

import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({
  placeholder = 'Search...',
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
