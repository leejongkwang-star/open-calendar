import { useState, useEffect, useCallback, useRef } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'
import { gamesAPI } from '../../api/games'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const CELL_SIZE = 25

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L
]

const COLORS = [
  '#00f0f0', // I - cyan
  '#f0f000', // O - yellow
  '#a000f0', // T - purple
  '#00f000', // S - green
  '#f00000', // Z - red
  '#0000f0', // J - blue
  '#f0a000', // L - orange
]

const createEmptyBoard = () => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
}

const createPiece = (shapeIndex) => {
  return {
    shape: SHAPES[shapeIndex],
    color: COLORS[shapeIndex],
    x: Math.floor(BOARD_WIDTH / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2),
    y: 0,
  }
}

const rotateShape = (shape) => {
  const rows = shape.length
  const cols = shape[0].length
  const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0))
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      rotated[j][rows - 1 - i] = shape[i][j]
    }
  }
  
  return rotated
}

const isValidPosition = (board, piece, dx = 0, dy = 0) => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x + dx
        const newY = piece.y + y + dy
        
        if (
          newX < 0 ||
          newX >= BOARD_WIDTH ||
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX])
        ) {
          return false
        }
      }
    }
  }
  return true
}

const placePiece = (board, piece) => {
  const newBoard = board.map(row => [...row])
  
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.y + y
        const boardX = piece.x + x
        if (boardY >= 0) {
          newBoard[boardY][boardX] = piece.color
        }
      }
    }
  }
  
  return newBoard
}

const clearLines = (board) => {
  const newBoard = board.filter(row => !row.every(cell => cell !== 0))
  const linesCleared = BOARD_HEIGHT - newBoard.length
  
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0))
  }
  
  return { board: newBoard, linesCleared }
}

function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const gameLoopRef = useRef(null)
  const dropTimeRef = useRef(Date.now())
  const touchStartRef = useRef(null)
  const lastTapRef = useRef(0)

  const [bestScore, setBestScore] = useState(0)

  // 최고 기록 로드
  useEffect(() => {
    const loadBestScore = async () => {
      try {
        const result = await gamesAPI.getMyBestScore('TETRIS')
        if (result.score) {
          setBestScore(result.score.score)
        }
      } catch (error) {
        console.error('최고 기록 로드 실패:', error)
      }
    }
    loadBestScore()
  }, [])

  const spawnPiece = useCallback(() => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length)
    const piece = createPiece(shapeIndex)
    
    if (!isValidPosition(board, piece)) {
      setGameOver(true)
      // 게임 오버 시 점수 저장
      if (score > bestScore) {
        gamesAPI.saveScore('TETRIS', score)
          .then((result) => {
            if (result.score) {
              setBestScore(result.score.score)
            }
          })
          .catch((error) => {
            console.error('점수 저장 실패:', error)
          })
      }
      return null
    }
    
    return piece
  }, [board, score, bestScore])

  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || gameOver || isPaused) return
    
    if (isValidPosition(board, currentPiece, dx, dy)) {
      setCurrentPiece({ ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy })
      return true
    }
    return false
  }, [board, currentPiece, gameOver, isPaused])

  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return
    
    const rotatedShape = rotateShape(currentPiece.shape)
    const rotatedPiece = { ...currentPiece, shape: rotatedShape }
    
    if (isValidPosition(board, rotatedPiece)) {
      setCurrentPiece(rotatedPiece)
    }
  }, [board, currentPiece, gameOver, isPaused])

  const dropPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return
    
    if (!movePiece(0, 1)) {
      const newBoard = placePiece(board, currentPiece)
      const { board: clearedBoard, linesCleared } = clearLines(newBoard)
      
      setBoard(clearedBoard)
      setLines(prev => {
        const newLines = prev + linesCleared
        setLevel(Math.floor(newLines / 10) + 1)
        return newLines
      })
      setScore(prev => {
        const newScore = prev + linesCleared * 100 * level
        // 최고 기록 갱신 시 서버에 저장
        if (newScore > bestScore) {
          gamesAPI.saveScore('TETRIS', newScore)
            .then((result) => {
              if (result.score) {
                setBestScore(result.score.score)
              }
            })
            .catch((error) => {
              console.error('점수 저장 실패:', error)
            })
        }
        return newScore
      })
      
      const nextPiece = spawnPiece()
      setCurrentPiece(nextPiece)
      dropTimeRef.current = Date.now()
    }
  }, [board, currentPiece, gameOver, isPaused, level, spawnPiece, movePiece, bestScore])

  const handleKeyPress = useCallback((e) => {
    if (!gameStarted || gameOver) return
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        movePiece(-1, 0)
        break
      case 'ArrowRight':
        e.preventDefault()
        movePiece(1, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        dropPiece()
        break
      case 'ArrowUp':
        e.preventDefault()
        rotatePiece()
        break
      case ' ':
        e.preventDefault()
        setIsPaused(prev => !prev)
        break
      default:
        break
    }
  }, [gameStarted, gameOver, movePiece, dropPiece, rotatePiece])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused && currentPiece) {
      const dropInterval = Math.max(100, 1000 - (level - 1) * 100)
      
      const gameLoop = () => {
        const now = Date.now()
        if (now - dropTimeRef.current > dropInterval) {
          dropPiece()
        }
        gameLoopRef.current = requestAnimationFrame(gameLoop)
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop)
      return () => {
        if (gameLoopRef.current) {
          cancelAnimationFrame(gameLoopRef.current)
        }
      }
    }
  }, [gameStarted, gameOver, isPaused, currentPiece, level, dropPiece])

  const startGame = () => {
    const newBoard = createEmptyBoard()
    setBoard(newBoard)
    setScore(0)
    setLevel(1)
    setLines(0)
    setGameOver(false)
    setIsPaused(false)
    setGameStarted(true)
    const piece = spawnPiece()
    setCurrentPiece(piece)
    dropTimeRef.current = Date.now()
  }

  const resetGame = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    setBoard(createEmptyBoard())
    setCurrentPiece(null)
    setScore(0)
    setLevel(1)
    setLines(0)
    setGameOver(false)
    setIsPaused(false)
    setGameStarted(false)
  }

  const displayBoard = currentPiece ? placePiece(board, currentPiece) : board

  // 터치 이벤트 핸들러 (스와이프 제스처 및 더블 탭)
  const handleTouchStart = (e) => {
    if (!gameStarted || gameOver) return
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || !gameStarted || gameOver) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    const minSwipeDistance = 30
    const maxTapTime = 300

    // 더블 탭 감지 (회전)
    const now = Date.now()
    if (deltaTime < maxTapTime && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (now - lastTapRef.current < 300) {
        rotatePiece()
        lastTapRef.current = 0
        touchStartRef.current = null
        return
      }
      lastTapRef.current = now
      touchStartRef.current = null
      return
    }

    // 스와이프 감지
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 수평 스와이프
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          movePiece(1, 0)
        } else {
          movePiece(-1, 0)
        }
      }
    } else {
      // 수직 스와이프
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          dropPiece()
        } else {
          // 위로 스와이프는 회전
          rotatePiece()
        }
      }
    }

    touchStartRef.current = null
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">테트리스</h2>

      <div className="flex gap-6 mb-6">
        {/* 게임 보드 */}
        <div className="relative">
          <div
            className="bg-gray-900 p-2 rounded-lg touch-none"
            style={{
              width: BOARD_WIDTH * CELL_SIZE + 4,
              height: BOARD_HEIGHT * CELL_SIZE + 4,
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="grid" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)` }}>
              {displayBoard.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="border border-gray-700"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: cell || '#1a1a1a',
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* 게임 오버 오버레이 */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="text-2xl font-bold mb-2">게임 오버!</div>
                <div className="text-lg">점수: {score}</div>
              </div>
            </div>
          )}

          {/* 시작 전 오버레이 */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <div className="text-xl font-bold mb-2">테트리스</div>
                <button
                  onClick={startGame}
                  className="px-4 py-2 bg-green-500 rounded hover:bg-green-600"
                >
                  시작
                </button>
              </div>
            </div>
          )}

          {/* 일시정지 오버레이 */}
          {isPaused && gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-xl font-bold">일시정지</div>
            </div>
          )}
        </div>

        {/* 정보 패널 */}
        <div className="flex flex-col gap-4">
          <div className="bg-gray-800 text-white px-4 py-2 rounded">
            <div className="text-sm">점수</div>
            <div className="text-xl font-bold">{score}</div>
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded">
            <div className="text-sm">최고 점수</div>
            <div className="text-xl font-bold">{bestScore}</div>
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded">
            <div className="text-sm">레벨</div>
            <div className="text-xl font-bold">{level}</div>
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded">
            <div className="text-sm">라인</div>
            <div className="text-xl font-bold">{lines}</div>
          </div>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 mb-4">
        {!gameStarted && (
          <button
            onClick={startGame}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            시작
          </button>
        )}
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          <RotateCcw className="w-4 h-4" />
          리셋
        </button>
      </div>

      {/* 모바일 컨트롤 버튼 (선택사항) */}
      {gameStarted && !gameOver && (
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="flex gap-2">
            <button
              onClick={rotatePiece}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-semibold"
            >
              ↻ 회전
            </button>
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm font-semibold"
            >
              {isPaused ? '▶ 재개' : '⏸ 일시정지'}
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 text-center">
        화살표 키 또는 스와이프로 이동/회전, 더블 탭으로 회전, 스페이스바로 일시정지
      </p>
    </div>
  )
}

export default Tetris

