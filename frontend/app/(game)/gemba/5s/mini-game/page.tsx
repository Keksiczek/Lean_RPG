'use client';

import { useState } from 'react';
import type { AuditScene } from '@/types/audit';
import { AuditGame } from '@/src/components/AuditGame';

export default function FiveSAuditMiniGamePage() {
  const [selectedScene, setSelectedScene] = useState<AuditScene | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <AuditGame
        scene={selectedScene}
        onSelectScene={(scene) => setSelectedScene(scene)}
        onComplete={() => setSelectedScene(null)}
      />
    </div>
  );
}
