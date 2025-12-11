'use client'

import { useState } from 'react'
import type { AuditScene } from '@/types/audit'
import { AuditGame } from '@/src/components/AuditGame'

export default function AuditPage() {
  const [scene, setScene] = useState<AuditScene | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">5S Audit</h1>
        <p className="text-gray-600">Learn and practice 5S methodology</p>
      </div>
      <AuditGame scene={scene} onSelectScene={setScene} onComplete={() => setScene(null)} />
    </div>
  )
}
