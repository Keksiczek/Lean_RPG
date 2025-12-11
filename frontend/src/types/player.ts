export interface GameResult {
  id: string
  gameType: 'audit' | 'ishikawa'
  score: number
  xpEarned: number
  completedAt: string
}

export interface Player {
  id: string
  username: string
  email: string
  level: number
  totalXp: number
  currentXp: number
  score: number
  gamesCompleted: number
  createdAt: string
  recentResults?: GameResult[]
}
