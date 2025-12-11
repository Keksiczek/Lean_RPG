import Link from 'next/link'

export default function GameHub() {
  const games = [
    {
      id: 'audit',
      title: '5S Audit',
      description: 'Learn 5S methodology through audit scenarios',
      icon: '📋',
      href: '/audit',
      difficulties: ['Easy', 'Medium', 'Hard'],
    },
    {
      id: 'ishikawa',
      title: 'Ishikawa Diagram',
      description: 'Root cause analysis with fishbone diagrams',
      icon: '🎣',
      href: '/ishikawa',
      difficulties: ['Easy', 'Medium', 'Hard'],
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Game Hub</h1>
        <p className="text-gray-600">Choose a mini-game to improve your Lean skills</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <Link key={game.id} href={game.href}>
            <div className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-lg transition cursor-pointer">
              <div className="text-4xl mb-3">{game.icon}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{game.title}</h2>
              <p className="text-gray-600 mb-4">{game.description}</p>
              <div className="flex gap-2">
                {game.difficulties.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-semibold"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
