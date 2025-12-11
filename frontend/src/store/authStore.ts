import { create } from 'zustand'
import type { AuthState, AuthUser } from '@/src/types/auth'
import { saveToken, clearToken } from '@/src/utils/auth'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Login failed')
      const data = await res.json()
      saveToken(data.token)
      set({ user: data.user as AuthUser, token: data.token, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },
  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      if (!res.ok) throw new Error('Registration failed')
      const data = await res.json()
      saveToken(data.token)
      set({ user: data.user as AuthUser, token: data.token, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearToken()
    set({ user: null, token: null })
  },
}))
