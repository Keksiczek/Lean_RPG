'use client'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2 text-blue-600">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span className="text-sm font-semibold">Loading...</span>
    </div>
  )
}
