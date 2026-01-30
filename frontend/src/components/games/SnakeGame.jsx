import { useState, useEffect, useCallback, useRef } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_DIRECTION = { x: 1, y: 0 }
const GAME_SPEED = 150

function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [direction, setDirection] = useState(INITIAL_DIRECTION)
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const directionRef = useRef(INITIAL_DIRECTION)
  const gameLoopRef = useRef(null)

  const getBestScore = () => {
    return parseInt(localStorage.getItem('snake_best_score') || '0', 10)
  }

  const saveBestScore = (score) => {
    const best = getBestScore()
    if (score > best) {
      localStorage.setItem('snake_best_score', score.toString())
    }
  }

  const [bestScore, setBestScore] = useState(getBestScore())

  // 랜덤 음식 생성
  const generateFood = useCallback((snakeBody) => {
    let newFood
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  // 충돌 체크
  const checkCollision = useCallback((head, body) => {
    // 벽 충돌
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true
    }
    // 자기 몸 충돌
    return body.some(segment => segment.x === head.x && segment.y === head.y)
  }, [])

  // 게임 루프
  const gameLoop = useCallback(() => {
    if (isPaused || gameOver || !gameStarted) return

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] }
      const newDirection = directionRef.current

      // 방향에 따라 머리 이동
      head.x += newDirection.x
      head.y += newDirection.y

      // 충돌 체크
      if (checkCollision(head, prevSnake)) {
        setGameOver(true)
        saveBestScore(score)
        setBestScore(getBestScore())
        return prevSnake
      }

      const newSnake = [head, ...prevSnake]

      // 음식 먹기
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10
          saveBestScore(newScore)
          setBestScore(getBestScore())
          return newScore
        })
        setFood(generateFood(newSnake))
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [food, isPaused, gameOver, gameStarted, checkCollision, generateFood, score])

  // 키보드 입력 처리
  const handleKeyPress = useCallback((e) => {
    if (!gameStarted || gameOver) return

    const key = e.key
    const currentDir = directionRef.current

    switch (key) {
      case 'ArrowUp':
        e.preventDefault()
        if (currentDir.y === 0) {
          directionRef.current = { x: 0, y: -1 }
          setDirection({ x: 0, y: -1 })
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (currentDir.y === 0) {
          directionRef.current = { x: 0, y: 1 }
          setDirection({ x: 0, y: 1 })
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (currentDir.x === 0) {
          directionRef.current = { x: -1, y: 0 }
          setDirection({ x: -1, y: 0 })
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (currentDir.x === 0) {
          directionRef.current = { x: 1, y: 0 }
          setDirection({ x: 1, y: 0 })
        }
        break
      case ' ':
        e.preventDefault()
        setIsPaused(prev => !prev)
        break
      default:
        break
    }
  }, [gameStarted, gameOver])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // 게임 루프 실행
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, GAME_SPEED)
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current)
        }
      }
    }
  }, [gameLoop, gameStarted, gameOver])

  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setFood(generateFood(INITIAL_SNAKE))
    setGameOver(false)
    setScore(0)
    setIsPaused(false)
    setGameStarted(true)
  }

  const resetGame = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    directionRef.current = INITIAL_DIRECTION
    setFood(generateFood(INITIAL_SNAKE))
    setGameOver(false)
    setScore(0)
    setIsPaused(false)
    setGameStarted(false)
  }

  return (
    <div className="flex flex-col items-center">
      {/* 점수 표시 */}
      <div className="flex gap-4 mb-4">
        <div className="bg-gray-800 text-white px-4 py-2 rounded">
          <div className="text-sm">점수</div>
          <div className="text-xl font-bold">{score}</div>
        </div>
        <div className="bg-gray-800 text-white px-4 py-2 rounded">
          <div className="text-sm">최고 점수</div>
          <div className="text-xl font-bold">{bestScore}</div>
        </div>
      </div>

      {/* 게임 보드 */}
      <div className="relative bg-gray-900 p-2 rounded-lg mb-4">
        <div
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            position: 'relative',
          }}
        >
          {/* 뱀 */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute ${
                index === 0 ? 'bg-green-400' : 'bg-green-500'
              } rounded-sm`}
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          ))}

          {/* 음식 */}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />
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
              <div className="text-xl font-bold mb-2">뱀 게임</div>
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

      {/* 모바일 컨트롤 */}
      {gameStarted && !gameOver && (
        <div className="grid grid-cols-3 gap-2 max-w-xs mb-4">
          <div></div>
          <button
            onClick={() => {
              if (directionRef.current.y === 0) {
                directionRef.current = { x: 0, y: -1 }
                setDirection({ x: 0, y: -1 })
              }
            }}
            className="p-4 bg-gray-200 rounded hover:bg-gray-300"
          >
            ↑
          </button>
          <div></div>
          <button
            onClick={() => {
              if (directionRef.current.x === 0) {
                directionRef.current = { x: -1, y: 0 }
                setDirection({ x: -1, y: 0 })
              }
            }}
            className="p-4 bg-gray-200 rounded hover:bg-gray-300"
          >
            ←
          </button>
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="p-4 bg-gray-200 rounded hover:bg-gray-300"
          >
            ⏸
          </button>
          <button
            onClick={() => {
              if (directionRef.current.x === 0) {
                directionRef.current = { x: 1, y: 0 }
                setDirection({ x: 1, y: 0 })
              }
            }}
            className="p-4 bg-gray-200 rounded hover:bg-gray-300"
          >
            →
          </button>
          <div></div>
          <button
            onClick={() => {
              if (directionRef.current.y === 0) {
                directionRef.current = { x: 0, y: 1 }
                setDirection({ x: 0, y: 1 })
              }
            }}
            className="p-4 bg-gray-200 rounded hover:bg-gray-300"
          >
            ↓
          </button>
          <div></div>
        </div>
      )}

      <p className="text-sm text-gray-600 text-center">
        화살표 키로 이동하세요. 스페이스바로 일시정지
      </p>
    </div>
  )
}

export default SnakeGame

