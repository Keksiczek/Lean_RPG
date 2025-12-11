import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/src/utils/auth'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const userId = verifyToken(authHeader)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    console.log('Ishikawa result:', body)

    return NextResponse.json({ success: true, id: 'mock-id' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
