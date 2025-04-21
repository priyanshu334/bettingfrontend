import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2, Gem, Palette } from 'lucide-react';

const games = [
  { 
    name: 'Plinko', 
    description: 'Drop balls and win big prizes',
    icon: <Gamepad2 size={48} />, 
    color: 'from-orange-500 to-yellow-500',
    link: '/games/plinko' 
  },
  { 
    name: 'Mines', 
    description: 'Find gems, avoid bombs',
    icon: <Gem size={48} />, 
    color: 'from-orange-600 to-yellow-600',
    link: '/games/mines' 
  },
  { 
    name: 'Color Change', 
    description: 'Match colors to win rewards',
    icon: <Palette size={48} />, 
    color: 'from-orange-400 to-yellow-400',
    link: '/games/colorCode' 
  },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start bg-gradient-to-br from-orange-50 to-orange-100 text-gray-900 px-4 sm:px-6 md:px-8 py-12">
      {/* Header */}
      <div className="w-full max-w-6xl bg-gradient-to-r from-orange-500 to-yellow-500 rounded-3xl mb-10 p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow">
              IPL Fantasy Zone
            </h1>
            <p className="text-white/90 mt-3 text-lg sm:text-xl">
              Play, Predict, Win like a champion!
            </p>
          </div>
          <div className="mt-6 md:mt-0 bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-md">
            <span className="text-orange-600 font-extrabold text-2xl">IPL</span>
          </div>
        </div>
      </div>

      {/* Game Section */}
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-yellow-500">
            Choose Your Game
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-xl mx-auto">
            Dive into thrilling cricket-themed games and test your skills!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game) => (
            <Link key={game.name} href={game.link} className="block">
              <Card className="h-full bg-white border border-orange-200 rounded-2xl shadow-lg hover:shadow-orange-300 transition duration-300 overflow-hidden group">
                <div className={`bg-gradient-to-br ${game.color} p-6 sm:p-8 flex items-center justify-center`}>
                  <div className="text-white transform group-hover:scale-110 transition duration-300">
                    {game.icon}
                  </div>
                </div>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-orange-600 mb-2">{game.name}</h2>
                  <p className="text-gray-600 text-sm sm:text-base">{game.description}</p>
                </CardContent>
                <div className="px-5 pb-5">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-center text-white text-sm py-2 rounded-lg group-hover:from-orange-600 group-hover:to-yellow-600 transition font-medium shadow">
                    Play Now
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Tournament Callout */}
        <div className="mt-16 p-6 sm:p-8 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl border border-orange-300 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-orange-600 mb-2">Daily Tournaments</h3>
              <p className="text-gray-700 text-base">
                Compete with other fans and win exclusive rewards!
              </p>
            </div>
            <div>
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer hover:from-orange-600 hover:to-yellow-600 transition shadow-md">
                Join Tournament
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
