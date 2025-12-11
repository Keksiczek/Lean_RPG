'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/src/store/authStore'
import { LoadingSpinner } from '@/src/components/LoadingSpinner'

export default function LogoutPage() {
  const router = useRouter()
  const { logout } = useAuthStore()

  useEffect(() => {
    const doLogout = async () => {
      await logout()
      router.replace('/auth/login')
    }
    void doLogout()
  }, [logout, router])

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md bg-white shadow-lg rounded-xl p-8 mx-4">
      <LoadingSpinner />
      <p className="mt-4 text-gray-700">Logging out...</p>
    </div>
  )
}
