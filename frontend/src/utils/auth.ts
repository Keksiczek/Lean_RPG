import { cookies } from 'next/headers'

const TOKEN_KEY = 'token'

type DecodedPayload = {
  sub?: string
  userId?: string
  id?: string
  username?: string
  email?: string
  exp?: number
}

export function decodeToken(token: string): DecodedPayload | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const decoded =
      typeof window === 'undefined'
        ? Buffer.from(payload, 'base64').toString()
        : atob(payload)
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode token', error)
    return null
  }
}

function extractBearer(rawToken: string | string[] | null): string | null {
  if (!rawToken) return null
  const tokenValue = Array.isArray(rawToken) ? rawToken[1] ?? rawToken[0] : rawToken
  if (!tokenValue) return null
  if (tokenValue.includes(' ')) {
    const [, value] = tokenValue.split(' ')
    return value ?? null
  }
  return tokenValue
}

export function verifyToken(rawToken: string | string[] | null): string | null {
  const token = extractBearer(rawToken)
  if (!token) return null
  const payload = decodeToken(token)
  if (!payload) return null
  if (payload.exp && Date.now() / 1000 > payload.exp) return null
  return payload.sub ?? payload.userId ?? payload.id ?? null
}

export async function getSession() {
  const token = cookies().get(TOKEN_KEY)?.value
  if (!token) return null
  const payload = decodeToken(token)
  if (!payload) return null
  return {
    userId: payload.sub ?? payload.userId ?? payload.id ?? null,
    username: payload.username,
    email: payload.email,
    token,
  }
}

export function saveToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
    document.cookie = `${TOKEN_KEY}=${token}; path=/;`
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  }
}

export function getClientToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
