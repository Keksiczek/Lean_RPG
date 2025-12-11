'use client'

import { useEffect } from 'react'
import { usePlayerStore } from '@/src/store/playerStore'

export function StatsBar() {
  const player = usePlayerStore((s) => s.player)

  useEffect(() => {
    usePlayerStore.getState().fetchPlayer()
  }, [])

  if (!player) return null

  const xpToNextLevel = 1000
  const xpProgress = Math.min((player.currentXp / xpToNextLevel) * 100, 100)

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-xs text-gray-600">LEVEL</p>
            <p className="text-2xl font-bold text-blue-600">{player.level}</p>
          </div>
          <div className="w-64">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-gray-700">XP</span>
              <span className="text-xs text-gray-600">
                {player.currentXp} / {xpToNextLevel}
              </span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">TOTAL SCORE</p>
          <p className="text-2xl font-bold text-orange-600">{player.score}</p>
        </div>
      </div>
    </div>
  )
}
