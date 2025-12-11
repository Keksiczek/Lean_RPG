import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { username, email } = await req.json()
  const payload = Buffer.from(
    JSON.stringify({
      sub: '2',
      username,
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    })
  ).toString('base64')
  const mockToken = `header.${payload}.signature`
  const response = NextResponse.json({
    token: mockToken,
    user: { id: '2', username, email },
  })
  response.cookies.set('token', mockToken, { path: '/', httpOnly: false })
  return response
}
