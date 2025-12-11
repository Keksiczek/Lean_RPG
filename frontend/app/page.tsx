import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-white mb-4">Lean RPG</h1>
        <p className="text-xl text-blue-100 mb-8">
          Learn Lean methodologies through gamified mini-games
        </p>

        <div className="space-y-3">
          <Link href="/auth/login">
            <button className="w-full max-w-md bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50">
              Login
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="w-full max-w-md bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-400">
              Register
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
