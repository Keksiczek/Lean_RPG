import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/logout', '/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith('/api/auth'))

  if (isPublic) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  if (!token && pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!token && !isPublic && pathname.startsWith('/')) {
    const url = new URL('/auth/login', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
