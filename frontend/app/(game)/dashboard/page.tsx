'use client'

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/src/store/playerStore'
import { LoadingSpinner } from '@/src/components/LoadingSpinner'

export default function DashboardPage() {
  const player = usePlayerStore((s) => s.player)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usePlayerStore.getState().fetchPlayer()
    setLoading(false)
  }, [])

  if (loading) return <LoadingSpinner />
  if (!player) return <div>No player data</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Your Lean RPG progress</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Level</p>
          <p className="text-3xl font-bold text-blue-600">{player.level}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600">Total XP</p>
          <p className="text-3xl font-bold text-green-600">{player.totalXp}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Games Played</p>
          <p className="text-3xl font-bold text-purple-600">{player.gamesCompleted}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600">Score</p>
          <p className="text-3xl font-bold text-orange-600">{player.score}</p>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Games</h2>
        <div className="space-y-2">
          {player.recentResults?.map((result) => (
            <div key={result.id} className="p-4 bg-gray-50 rounded border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold capitalize">{result.gameType}</span>
                <span className="text-green-600 font-bold">+{result.xpEarned} XP</span>
              </div>
              <p className="text-sm text-gray-600">{result.completedAt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
