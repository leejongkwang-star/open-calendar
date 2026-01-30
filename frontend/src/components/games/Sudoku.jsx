import { useState, useEffect } from 'react'
import { RotateCcw, Check } from 'lucide-react'

const GRID_SIZE = 4 // 4x4 스도쿠 (간단 버전)
const BOX_SIZE = 2

// 초기 퍼즐 생성 (해결 가능한 퍼즐)
const generatePuzzle = (difficulty = 0.5) => {
  // 완전한 해결책 생성
  const solution = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0))
  
  // 간단한 백트래킹으로 해결책 생성
  const solve = (grid) => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          const numbers = [1, 2, 3, 4].sort(() => Math.random() - 0.5)
          for (let num of numbers) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num
              if (solve(grid)) return true
              grid[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }
  
  solve(solution)
  
  // 일부 숫자 제거하여 퍼즐 생성
  const puzzle = solution.map(row => [...row])
  const cellsToRemove = Math.floor(GRID_SIZE * GRID_SIZE * difficulty)
  
  for (let i = 0; i < cellsToRemove; i++) {
    const row = Math.floor(Math.random() * GRID_SIZE)
    const col = Math.floor(Math.random() * GRID_SIZE)
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0
    } else {
      i--
    }
  }
  
  return { puzzle, solution }
}

// 유효성 검사
const isValid = (grid, row, col, num) => {
  // 행 체크
  for (let c = 0; c < GRID_SIZE; c++) {
    if (grid[row][c] === num) return false
  }
  
  // 열 체크
  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r][col] === num) return false
  }
  
  // 박스 체크
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (grid[r][c] === num) return false
    }
  }
  
  return true
}

// 해결책 확인
const checkSolution = (puzzle, solution) => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (puzzle[row][col] !== solution[row][col]) {
        return false
      }
    }
  }
  return true
}

function Sudoku() {
  const [puzzle, setPuzzle] = useState(null)
  const [solution, setSolution] = useState(null)
  const [userGrid, setUserGrid] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)
  const [isSolved, setIsSolved] = useState(false)
  const [errors, setErrors] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
  const [showErrors, setShowErrors] = useState(true)

  const initializeGame = (difficulty = 0.5) => {
    const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(difficulty)
    setPuzzle(newPuzzle)
    setSolution(newSolution)
    setUserGrid(newPuzzle.map(row => [...row]))
    setSelectedCell(null)
    setIsSolved(false)
    setErrors(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)))
  }

  useEffect(() => {
    initializeGame(0.5)
  }, [])

  const handleCellClick = (row, col) => {
    if (puzzle[row][col] !== 0) return // 초기 숫자는 수정 불가
    setSelectedCell({ row, col })
  }

  const handleNumberInput = (num) => {
    if (!selectedCell || puzzle[selectedCell.row][selectedCell.col] !== 0) return
    
    const newGrid = userGrid.map(r => [...r])
    newGrid[selectedCell.row][selectedCell.col] = num
    
    // 에러 체크
    const newErrors = errors.map(r => [...r])
    if (solution[selectedCell.row][selectedCell.col] !== num) {
      newErrors[selectedCell.row][selectedCell.col] = true
    } else {
      newErrors[selectedCell.row][selectedCell.col] = false
    }
    
    setUserGrid(newGrid)
    setErrors(newErrors)
    
    // 해결 여부 체크
    if (checkSolution(newGrid, solution)) {
      setIsSolved(true)
    }
  }

  const handleClear = () => {
    if (!selectedCell || puzzle[selectedCell.row][selectedCell.col] !== 0) return
    
    const newGrid = userGrid.map(r => [...r])
    newGrid[selectedCell.row][selectedCell.col] = 0
    
    const newErrors = errors.map(r => [...r])
    newErrors[selectedCell.row][selectedCell.col] = false
    
    setUserGrid(newGrid)
    setErrors(newErrors)
  }

  const handleCheck = () => {
    if (!userGrid || !solution) return
    
    const newErrors = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
    let hasError = false
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (userGrid[row][col] !== 0 && userGrid[row][col] !== solution[row][col]) {
          newErrors[row][col] = true
          hasError = true
        }
      }
    }
    
    setErrors(newErrors)
    setShowErrors(true)
    
    if (!hasError && checkSolution(userGrid, solution)) {
      setIsSolved(true)
    }
  }

  if (!puzzle || !userGrid) {
    return <div>로딩 중...</div>
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">스도쿠 (4x4)</h2>

      {/* 게임 상태 */}
      {isSolved && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg">
          <span className="text-green-800 font-semibold">축하합니다! 퍼즐을 완성했습니다! 🎉</span>
        </div>
      )}

      {/* 게임 보드 */}
      <div className="mb-6">
        <div className="grid gap-1 bg-gray-800 p-1 rounded-lg" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {userGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isInitial = puzzle[rowIndex][colIndex] !== 0
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
              const hasError = showErrors && errors[rowIndex][colIndex]
              const isBoxBorder = rowIndex % BOX_SIZE === BOX_SIZE - 1 && rowIndex < GRID_SIZE - 1
              const isBoxBorderRight = colIndex % BOX_SIZE === BOX_SIZE - 1 && colIndex < GRID_SIZE - 1
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  className={`
                    w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center
                    bg-white text-2xl font-bold cursor-pointer
                    ${isSelected ? 'ring-4 ring-primary-500' : ''}
                    ${hasError ? 'bg-red-200 text-red-800' : ''}
                    ${isInitial ? 'bg-gray-100 text-gray-800' : 'text-blue-600'}
                    ${isBoxBorder ? 'mb-1' : ''}
                    ${isBoxBorderRight ? 'mr-1' : ''}
                  `}
                >
                  {cell !== 0 ? cell : ''}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 숫자 입력 패드 */}
      <div className="grid grid-cols-4 gap-2 mb-6 max-w-xs">
        {[1, 2, 3, 4].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={!selectedCell || puzzle[selectedCell.row][selectedCell.col] !== 0}
            className="w-12 h-12 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-xl font-bold"
          >
            {num}
          </button>
        ))}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleClear}
          disabled={!selectedCell || puzzle[selectedCell.row][selectedCell.col] !== 0}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          지우기
        </button>
        <button
          onClick={handleCheck}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Check className="w-4 h-4" />
          확인
        </button>
        <button
          onClick={() => initializeGame(0.5)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          <RotateCcw className="w-4 h-4" />
          새 게임
        </button>
      </div>

      {/* 난이도 선택 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => initializeGame(0.3)}
          className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
        >
          쉬움
        </button>
        <button
          onClick={() => initializeGame(0.5)}
          className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
        >
          보통
        </button>
        <button
          onClick={() => initializeGame(0.7)}
          className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
        >
          어려움
        </button>
      </div>

      <p className="text-sm text-gray-600 text-center">
        각 행, 열, 2x2 박스에 1-4가 한 번씩만 나타나야 합니다
      </p>
    </div>
  )
}

export default Sudoku

