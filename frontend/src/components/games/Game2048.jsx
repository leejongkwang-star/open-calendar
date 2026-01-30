import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'

const GRID_SIZE = 4
const WINNING_TILE = 2048

// 빈 그리드 생성
const createEmptyGrid = () => {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
}

// 랜덤 위치에 2 또는 4 추가
const addRandomTile = (grid) => {
  const emptyCells = []
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) {
        emptyCells.push([i, j])
      }
    }
  }
  
  if (emptyCells.length === 0) return grid
  
  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const newGrid = grid.map(row => [...row])
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4
  return newGrid
}

// 초기 그리드 생성
const initializeGrid = () => {
  let grid = createEmptyGrid()
  grid = addRandomTile(grid)
  grid = addRandomTile(grid)
  return grid
}

// 그리드 복사
const copyGrid = (grid) => grid.map(row => [...row])

// 그리드 비교
const gridsEqual = (grid1, grid2) => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid1[i][j] !== grid2[i][j]) return false
    }
  }
  return true
}

// 행을 왼쪽으로 이동 및 병합
const moveRowLeft = (row) => {
  const filtered = row.filter(val => val !== 0)
  const merged = []
  
  for (let i = 0; i < filtered.length; i++) {
    if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2)
      i++
    } else {
      merged.push(filtered[i])
    }
  }
  
  while (merged.length < GRID_SIZE) {
    merged.push(0)
  }
  
  return merged
}

// 그리드 회전
const rotateGrid = (grid, clockwise = true) => {
  const newGrid = createEmptyGrid()
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (clockwise) {
        newGrid[j][GRID_SIZE - 1 - i] = grid[i][j]
      } else {
        newGrid[GRID_SIZE - 1 - j][i] = grid[i][j]
      }
    }
  }
  return newGrid
}

// 이동 함수
const move = (grid, direction) => {
  let newGrid = copyGrid(grid)
  
  if (direction === 'left') {
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid[i] = moveRowLeft(newGrid[i])
    }
  } else if (direction === 'right') {
    newGrid = rotateGrid(newGrid, true)
    newGrid = rotateGrid(newGrid, true)
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid[i] = moveRowLeft(newGrid[i])
    }
    newGrid = rotateGrid(newGrid, true)
    newGrid = rotateGrid(newGrid, true)
  } else if (direction === 'up') {
    newGrid = rotateGrid(newGrid, false)
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid[i] = moveRowLeft(newGrid[i])
    }
    newGrid = rotateGrid(newGrid, true)
  } else if (direction === 'down') {
    newGrid = rotateGrid(newGrid, true)
    for (let i = 0; i < GRID_SIZE; i++) {
      newGrid[i] = moveRowLeft(newGrid[i])
    }
    newGrid = rotateGrid(newGrid, false)
  }
  
  return newGrid
}

// 게임 종료 체크
const isGameOver = (grid) => {
  // 빈 칸이 있으면 게임 계속
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) return false
    }
  }
  
  // 인접한 타일이 같은 값이 있는지 확인
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const current = grid[i][j]
      if (
        (i < GRID_SIZE - 1 && grid[i + 1][j] === current) ||
        (j < GRID_SIZE - 1 && grid[i][j + 1] === current)
      ) {
        return false
      }
    }
  }
  
  return true
}

// 최고 점수 가져오기
const getBestScore = () => {
  return parseInt(localStorage.getItem('2048_best_score') || '0', 10)
}

// 최고 점수 저장
const saveBestScore = (score) => {
  const best = getBestScore()
  if (score > best) {
    localStorage.setItem('2048_best_score', score.toString())
  }
}

function Game2048() {
  const [grid, setGrid] = useState(initializeGrid)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(getBestScore())
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)

  // 점수 계산
  useEffect(() => {
    let total = 0
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        total += grid[i][j]
      }
    }
    setScore(total)
    saveBestScore(total)
    setBestScore(getBestScore())
    
    // 승리 체크
    if (!won) {
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          if (grid[i][j] === WINNING_TILE) {
            setWon(true)
          }
        }
      }
    }
    
    // 게임 오버 체크
    if (isGameOver(grid)) {
      setGameOver(true)
    }
  }, [grid, won])

  const handleMove = useCallback((direction) => {
    if (gameOver) return
    
    const newGrid = move(grid, direction)
    
    if (!gridsEqual(grid, newGrid)) {
      const gridWithNewTile = addRandomTile(newGrid)
      setGrid(gridWithNewTile)
    }
  }, [grid, gameOver])

  const handleKeyPress = useCallback((e) => {
    if (gameOver) return
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        handleMove('left')
        break
      case 'ArrowRight':
        e.preventDefault()
        handleMove('right')
        break
      case 'ArrowUp':
        e.preventDefault()
        handleMove('up')
        break
      case 'ArrowDown':
        e.preventDefault()
        handleMove('down')
        break
      default:
        break
    }
  }, [handleMove, gameOver])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const handleReset = () => {
    setGrid(initializeGrid())
    setScore(0)
    setGameOver(false)
    setWon(false)
  }

  const getTileColor = (value) => {
    const colors = {
      0: 'bg-gray-200',
      2: 'bg-gray-100',
      4: 'bg-yellow-100',
      8: 'bg-yellow-200',
      16: 'bg-orange-200',
      32: 'bg-orange-300',
      64: 'bg-red-300',
      128: 'bg-red-400',
      256: 'bg-pink-400',
      512: 'bg-pink-500',
      1024: 'bg-purple-400',
      2048: 'bg-purple-500',
    }
    return colors[value] || 'bg-purple-600'
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
      <div className="bg-gray-300 p-2 rounded-lg mb-4">
        <div className="grid grid-cols-4 gap-2">
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded font-bold text-lg sm:text-xl ${
                  cell === 0 ? 'bg-gray-200' : `${getTileColor(cell)} text-gray-800`
                }`}
              >
                {cell !== 0 && cell}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 게임 상태 메시지 */}
      {won && !gameOver && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-semibold">2048 달성! 계속 플레이하세요!</span>
        </div>
      )}

      {gameOver && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg">
          <span className="text-red-800 font-semibold">게임 오버!</span>
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          <RotateCcw className="w-4 h-4" />
          다시 시작
        </button>
      </div>

      {/* 모바일 컨트롤 */}
      <div className="grid grid-cols-3 gap-2 max-w-xs">
        <div></div>
        <button
          onClick={() => handleMove('up')}
          className="p-4 bg-gray-200 rounded hover:bg-gray-300"
        >
          ↑
        </button>
        <div></div>
        <button
          onClick={() => handleMove('left')}
          className="p-4 bg-gray-200 rounded hover:bg-gray-300"
        >
          ←
        </button>
        <button
          onClick={() => handleMove('down')}
          className="p-4 bg-gray-200 rounded hover:bg-gray-300"
        >
          ↓
        </button>
        <button
          onClick={() => handleMove('right')}
          className="p-4 bg-gray-200 rounded hover:bg-gray-300"
        >
          →
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-4 text-center">
        화살표 키 또는 버튼을 사용하여 타일을 이동하세요
      </p>
    </div>
  )
}

export default Game2048

