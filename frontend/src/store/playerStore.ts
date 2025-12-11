import { create } from 'zustand'
import type { Player } from '@/src/types/player'

interface PlayerStoreState {
  player: Player | null
  fetchPlayer: () => Promise<void>
  updateXp: (xpGained: number) => void
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  player: null,
  fetchPlayer: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch('/api/player', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) throw new Error('Failed to fetch player')
      const player = await res.json()
      set({ player })
    } catch (error) {
      console.error('Fetch player error:', error)
    }
  },
  updateXp: (xpGained: number) => {
    set((state) => {
      if (!state.player) return state
      return {
        player: {
          ...state.player,
          totalXp: state.player.totalXp + xpGained,
          currentXp: state.player.currentXp + xpGained,
          score: state.player.score + Math.round(xpGained / 2),
        },
      }
    })
  },
}))
