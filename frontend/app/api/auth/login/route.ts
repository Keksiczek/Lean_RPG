import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const payload = Buffer.from(
    JSON.stringify({
      sub: '1',
      username: email.split('@')[0],
      email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    })
  ).toString('base64')
  const mockToken = `header.${payload}.signature`
  const response = NextResponse.json({
    token: mockToken,
    user: { id: '1', username: email.split('@')[0], email },
  })
  response.cookies.set('token', mockToken, { path: '/', httpOnly: false })
  return response
}
