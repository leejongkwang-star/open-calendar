import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

const BOARD_SIZE = 3
const EMPTY = null
const PLAYER = 'X'
const COMPUTER = 'O'

// 승리 조건 체크
const checkWinner = (board) => {
  const lines = [
    // 가로
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // 세로
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // 대각선
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let line of lines) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

// 미니맥스 알고리즘 (AI)
const minimax = (board, depth, isMaximizing) => {
  const winner = checkWinner(board)
  
  if (winner === COMPUTER) return 10 - depth
  if (winner === PLAYER) return depth - 10
  if (!board.includes(EMPTY)) return 0

  if (isMaximizing) {
    let bestScore = -Infinity
    for (let i = 0; i < board.length; i++) {
      if (board[i] === EMPTY) {
        board[i] = COMPUTER
        const score = minimax(board, depth + 1, false)
        board[i] = EMPTY
        bestScore = Math.max(score, bestScore)
      }
    }
    return bestScore
  } else {
    let bestScore = Infinity
    for (let i = 0; i < board.length; i++) {
      if (board[i] === EMPTY) {
        board[i] = PLAYER
        const score = minimax(board, depth + 1, true)
        board[i] = EMPTY
        bestScore = Math.min(score, bestScore)
      }
    }
    return bestScore
  }
}

// 컴퓨터 최적 수 찾기
const getBestMove = (board) => {
  let bestScore = -Infinity
  let bestMove = null

  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY) {
      board[i] = COMPUTER
      const score = minimax(board, 0, false)
      board[i] = EMPTY
      if (score > bestScore) {
        bestScore = score
        bestMove = i
      }
    }
  }
  return bestMove
}

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(EMPTY))
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [winner, setWinner] = useState(null)
  const [score, setScore] = useState({
    wins: parseInt(localStorage.getItem('tictactoe_wins') || '0', 10),
    losses: parseInt(localStorage.getItem('tictactoe_losses') || '0', 10),
    draws: parseInt(localStorage.getItem('tictactoe_draws') || '0', 10),
  })

  const saveScore = (newScore) => {
    localStorage.setItem('tictactoe_wins', newScore.wins.toString())
    localStorage.setItem('tictactoe_losses', newScore.losses.toString())
    localStorage.setItem('tictactoe_draws', newScore.draws.toString())
  }

  // 컴퓨터 턴
  useEffect(() => {
    if (!isPlayerTurn && !winner && board.includes(EMPTY)) {
      const timer = setTimeout(() => {
        const bestMove = getBestMove([...board])
        if (bestMove !== null) {
          const newBoard = [...board]
          newBoard[bestMove] = COMPUTER
          setBoard(newBoard)
          setIsPlayerTurn(true)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isPlayerTurn, board, winner])

  // 승리 체크
  useEffect(() => {
    const gameWinner = checkWinner(board)
    if (gameWinner) {
      setWinner(gameWinner)
      setScore(prev => {
        const newScore = {
          wins: prev.wins + (gameWinner === PLAYER ? 1 : 0),
          losses: prev.losses + (gameWinner === COMPUTER ? 1 : 0),
          draws: prev.draws,
        }
        saveScore(newScore)
        return newScore
      })
    } else if (!board.includes(EMPTY) && !gameWinner) {
      setWinner('draw')
      setScore(prev => {
        const newScore = {
          ...prev,
          draws: prev.draws + 1,
        }
        saveScore(newScore)
        return newScore
      })
    }
  }, [board])

  const handleCellClick = (index) => {
    if (board[index] !== EMPTY || !isPlayerTurn || winner) return

    const newBoard = [...board]
    newBoard[index] = PLAYER
    setBoard(newBoard)
    setIsPlayerTurn(false)
  }

  const reset = () => {
    setBoard(Array(9).fill(EMPTY))
    setIsPlayerTurn(true)
    setWinner(null)
  }

  const resetScore = () => {
    setScore({ wins: 0, losses: 0, draws: 0 })
    saveScore({ wins: 0, losses: 0, draws: 0 })
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">틱택토</h2>

      {/* 점수 표시 */}
      <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-md">
        <div className="bg-green-100 p-4 rounded text-center">
          <div className="text-sm text-green-700">승리</div>
          <div className="text-2xl font-bold text-green-800">{score.wins}</div>
        </div>
        <div className="bg-red-100 p-4 rounded text-center">
          <div className="text-sm text-red-700">패배</div>
          <div className="text-2xl font-bold text-red-800">{score.losses}</div>
        </div>
        <div className="bg-gray-100 p-4 rounded text-center">
          <div className="text-sm text-gray-700">무승부</div>
          <div className="text-2xl font-bold text-gray-800">{score.draws}</div>
        </div>
      </div>

      {/* 게임 상태 */}
      {winner && (
        <div className="mb-4 text-center">
          {winner === PLAYER && (
            <div className="text-2xl font-bold text-green-600">승리! 🎉</div>
          )}
          {winner === COMPUTER && (
            <div className="text-2xl font-bold text-red-600">패배 😢</div>
          )}
          {winner === 'draw' && (
            <div className="text-2xl font-bold text-gray-600">무승부 🤝</div>
          )}
        </div>
      )}

      {!winner && (
        <div className="mb-4 text-center">
          <div className="text-lg font-semibold">
            {isPlayerTurn ? '당신의 차례 (X)' : '컴퓨터 생각 중... (O)'}
          </div>
        </div>
      )}

      {/* 게임 보드 */}
      <div className="grid grid-cols-3 gap-2 mb-6 bg-gray-800 p-2 rounded-lg">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={cell !== EMPTY || !isPlayerTurn || winner}
            className={`w-20 h-20 sm:w-24 sm:h-24 bg-white rounded flex items-center justify-center text-4xl font-bold transition-all ${
              cell === EMPTY && isPlayerTurn && !winner
                ? 'hover:bg-gray-100 cursor-pointer'
                : 'cursor-not-allowed'
            } ${
              cell === PLAYER
                ? 'text-blue-600'
                : cell === COMPUTER
                ? 'text-red-600'
                : 'text-gray-400'
            }`}
          >
            {cell || ''}
          </button>
        ))}
      </div>

      {/* 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          <RotateCcw className="w-4 h-4" />
          다시 시작
        </button>
        <button
          onClick={resetScore}
          className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          점수 리셋
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-4 text-center">
        빈 칸을 클릭하여 X를 놓으세요. 3개를 연속으로 놓으면 승리!
      </p>
    </div>
  )
}

export default TicTacToe

