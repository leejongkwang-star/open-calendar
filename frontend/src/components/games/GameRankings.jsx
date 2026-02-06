import { useState, useEffect } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { gamesAPI } from '../../api/games'
import { useAuthStore } from '../../store/authStore'

const GAME_NAMES = {
  GAME_2048: '2048',
  SNAKE: '뱀 게임',
  TETRIS: '테트리스',
  REACTION: '반응속도 테스트',
  ROCK_PAPER_SCISSORS: '가위바위보',
  TIC_TAC_TOE: '틱택토',
  SUDOKU: '스도쿠',
}

const GAME_TYPES = Object.keys(GAME_NAMES)

// 점수 포맷팅 함수
const formatScore = (gameType, score) => {
  if (gameType === 'REACTION' || gameType === 'SUDOKU') {
    // 시간 (초 단위)
    return `${score.toFixed(3)}초`
  } else if (gameType === 'ROCK_PAPER_SCISSORS' || gameType === 'TIC_TAC_TOE') {
    // 승률 (퍼센트)
    return `${(score * 100).toFixed(1)}%`
  } else {
    // 점수
    return Math.floor(score).toLocaleString()
  }
}

function GameRankings() {
  const { user } = useAuthStore()
  const [selectedGame, setSelectedGame] = useState('GAME_2048')
  const [rankings, setRankings] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('top') // 'top' or 'around'

  // 랭킹 로드
  useEffect(() => {
    loadRankings()
  }, [selectedGame, viewMode])

  const loadRankings = async () => {
    setLoading(true)
    try {
      if (viewMode === 'around' && user) {
        // 내 주변 랭킹
        const result = await gamesAPI.getRankingsAroundMe(selectedGame)
        setRankings(result.rankings || [])
        setMyRank(result.myRank || null)
      } else {
        // 상위 랭킹
        const result = await gamesAPI.getRankings(selectedGame, 10, 0)
        setRankings(result.rankings || [])
        
        // 내 등수 조회
        if (user) {
          try {
            const myResult = await gamesAPI.getMyBestScore(selectedGame)
            if (myResult.rank) {
              setMyRank(myResult.rank)
            }
          } catch (error) {
            // 기록이 없을 수 있음
            setMyRank(null)
          }
        }
      }
    } catch (error) {
      console.error('랭킹 로드 실패:', error)
      setRankings([])
      setMyRank(null)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="text-gray-600 font-semibold">{rank}</span>
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">게임 랭킹</h2>

      {/* 게임 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          게임 선택
        </label>
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          {GAME_TYPES.map((gameType) => (
            <option key={gameType} value={gameType}>
              {GAME_NAMES[gameType]}
            </option>
          ))}
        </select>
      </div>

      {/* 뷰 모드 선택 */}
      {user && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setViewMode('top')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'top'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            상위 랭킹
          </button>
          <button
            onClick={() => setViewMode('around')}
            className={`px-4 py-2 rounded-md ${
              viewMode === 'around'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            내 주변
          </button>
        </div>
      )}

      {/* 내 등수 표시 */}
      {user && myRank && viewMode === 'top' && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="text-sm text-primary-700">
            내 등수: <span className="font-bold text-primary-900">{myRank}위</span>
          </div>
        </div>
      )}

      {/* 랭킹 테이블 */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">랭킹 데이터가 없습니다.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등수
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원번호
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    점수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankings.map((ranking) => (
                  <tr
                    key={ranking.userId}
                    className={`${
                      ranking.isMe
                        ? 'bg-primary-50 font-semibold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(ranking.rank)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ranking.userName}
                        {ranking.isMe && (
                          <span className="ml-2 text-xs text-primary-600">(나)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{ranking.employeeNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatScore(selectedGame, ranking.score)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameRankings

