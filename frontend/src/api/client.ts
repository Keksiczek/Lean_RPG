import { getClientToken, clearToken } from '@/src/utils/auth'

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getClientToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    if (response.status === 401) {
      clearToken()
    }
    const errorMessage = await response.text()
    throw new Error(errorMessage || 'Request failed')
  }
  return response.json() as Promise<T>
}
