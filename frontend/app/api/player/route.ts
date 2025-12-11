import { NextResponse } from 'next/server'
import { verifyToken } from '@/src/utils/auth'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const userId = verifyToken(authHeader)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const player = {
    id: userId,
    username: 'player1',
    email: 'player1@example.com',
    level: 5,
    totalXp: 4200,
    currentXp: 400,
    score: 8200,
    gamesCompleted: 12,
    createdAt: new Date().toISOString(),
    recentResults: [
      { id: 'r1', gameType: 'audit', score: 85, xpEarned: 150, completedAt: new Date().toISOString() },
      { id: 'r2', gameType: 'ishikawa', score: 92, xpEarned: 200, completedAt: new Date().toISOString() },
    ],
  }

  return NextResponse.json(player)
}
