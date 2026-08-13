import { useState } from 'react'
import { ArrowLeft, Trophy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Game2048 from '../components/games/Game2048'
import ReactionTest from '../components/games/ReactionTest'
import SnakeGame from '../components/games/SnakeGame'
import RockPaperScissors from '../components/games/RockPaperScissors'
import TicTacToe from '../components/games/TicTacToe'
import Tetris from '../components/games/Tetris'
import Sudoku from '../components/games/Sudoku'
import GalagaLite from '../components/games/GalagaLite'
import GameRankings from '../components/games/GameRankings'

const GAMES = [
  { id: 'galaga', name: '탄막 슈팅', icon: '🚀', component: GalagaLite },
  { id: '2048', name: '2048', icon: '🔢', component: Game2048 },
  { id: 'reaction', name: '반응속도 테스트', icon: '⚡', component: ReactionTest },
  { id: 'snake', name: '뱀 게임', icon: '🐍', component: SnakeGame },
  { id: 'rps', name: '가위바위보', icon: '✂️', component: RockPaperScissors },
  { id: 'tictactoe', name: '틱택토', icon: '⭕', component: TicTacToe },
  { id: 'tetris', name: '테트리스', icon: '🧩', component: Tetris },
  { id: 'sudoku', name: '스도쿠', icon: '🔢', component: Sudoku },
]

function GamesPage() {
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState(null)
  const [showRankings, setShowRankings] = useState(false)

  const handleBack = () => {
    if (selectedGame || showRankings) {
      setSelectedGame(null)
      setShowRankings(false)
    } else {
      navigate(-1)
    }
  }

  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId)
    setShowRankings(false)
  }

  const handleShowRankings = () => {
    setShowRankings(true)
    setSelectedGame(null)
  }

  const SelectedGameComponent = selectedGame
    ? GAMES.find(g => g.id === selectedGame)?.component
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {selectedGame
              ? GAMES.find(g => g.id === selectedGame)?.name
              : showRankings
              ? '랭킹'
              : '게임'}
          </h1>
        </div>

        {/* 게임 선택 화면 또는 게임 플레이 화면 */}
        {showRankings ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <GameRankings />
          </div>
        ) : !selectedGame ? (
          <div>
            {/* 랭킹 보기 버튼 */}
            <div className="mb-6">
              <button
                onClick={handleShowRankings}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
              >
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">랭킹 보기</span>
              </button>
            </div>

            {/* 게임 목록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left group"
                >
                  <div className="text-4xl mb-3">{game.icon}</div>
                  <h2 className="text-xl font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                    {game.name}
                  </h2>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {SelectedGameComponent && <SelectedGameComponent />}
          </div>
        )}
      </div>
    </div>
  )
}

export default GamesPage

