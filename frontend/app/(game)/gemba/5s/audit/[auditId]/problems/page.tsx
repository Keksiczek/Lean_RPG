'use client';

import Link from 'next/link';

export default function ProblemsPlaceholderPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Problem capture</h1>
      <p className="text-sm text-gray-700">
        Přidávání problémů je dostupné přímo v checklistu. Vrať se a přidej issues před odesláním auditu.
      </p>
      <Link href="/gemba/5s" className="text-blue-700">
        Zpět na 5S hub
      </Link>
    </div>
  );
}
