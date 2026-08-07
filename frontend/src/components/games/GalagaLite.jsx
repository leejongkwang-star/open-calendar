import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Trophy } from 'lucide-react'
import { gamesAPI } from '../../api/games'
import { WIDTH, HEIGHT, MAX_WAVES } from './galaga/constants'
import { createInitialState, renderGame, updateGame } from './galaga/engine'

function GalagaLite() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const inputRef = useRef({
    left: false,
    right: false,
    fire: false,
    dragX: null,
    autoFire: false,
    dragging: false,
  })
  const rafRef = useRef(null)
  const lastTimeRef = useRef(0)
  const savedScoreRef = useRef(false)
  const isPausedRef = useRef(false)

  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [wave, setWave] = useState(1)
  const [combo, setCombo] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const loadBestScore = async () => {
      try {
        const result = await gamesAPI.getMyBestScore('GALAGA')
        if (result.score) {
          setBestScore(result.score.score)
        }
      } catch (error) {
        console.error('최고 기록 로드 실패:', error)
      }
    }
    loadBestScore()
  }, [])

  const syncHud = useCallback((state) => {
    setScore(state.score)
    setLives(state.lives)
    setWave(state.wave)
    setCombo(state.combo)
    if (state.status === 'waveClear') {
      setStatusMessage(state.wave >= MAX_WAVES ? '최종 웨이브 클리어!' : `웨이브 ${state.wave} 클리어!`)
    } else {
      setStatusMessage('')
    }
  }, [])

  const saveScoreIfNeeded = useCallback(async (finalScore, state) => {
    if (savedScoreRef.current || finalScore <= 0) return
    savedScoreRef.current = true
    try {
      const result = await gamesAPI.saveScore('GALAGA', finalScore, {
        wave: state.wave,
        cleared: state.status === 'cleared',
        livesLeft: state.lives,
      })
      if (result?.score?.score != null) {
        setBestScore((prev) => Math.max(prev, result.score.score))
      } else if (finalScore > bestScore) {
        setBestScore(finalScore)
      }
    } catch (error) {
      console.error('점수 저장 실패:', error)
    }
  }, [bestScore])

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const state = stateRef.current
    if (!canvas || !state) return
    const ctx = canvas.getContext('2d')
    renderGame(ctx, state)
  }, [])

  const loop = useCallback((time) => {
    const state = stateRef.current
    if (!state) return

    const rawDt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016
    lastTimeRef.current = time
    const dt = Math.min(rawDt, 0.032)

    if (!isPausedRef.current && (state.status === 'playing' || state.status === 'waveClear')) {
      const input = inputRef.current
      // 터치 디바이스: 플레이 중 자동 연사 / PC: Space·Z
      const fire = input.autoFire || input.fire
      updateGame(state, dt, {
        left: input.left,
        right: input.right,
        fire,
        dragX: input.dragX,
      })
      syncHud(state)

      if (state.status === 'gameOver') {
        setGameOver(true)
        saveScoreIfNeeded(state.score, state)
      } else if (state.status === 'cleared') {
        setCleared(true)
        setGameOver(true)
        saveScoreIfNeeded(state.score, state)
      }
    }

    draw()
    rafRef.current = requestAnimationFrame(loop)
  }, [draw, saveScoreIfNeeded, syncHud])

  useEffect(() => {
    if (!gameStarted) return undefined
    lastTimeRef.current = 0
    rafRef.current = requestAnimationFrame(loop)
    return stopLoop
  }, [gameStarted, loop, stopLoop])

  // 키보드
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true
        e.preventDefault()
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true
        e.preventDefault()
      }
      if (e.code === 'Space' || e.code === 'KeyZ') {
        inputRef.current.fire = true
        e.preventDefault()
      }
      if (e.code === 'KeyP' && gameStarted && !gameOver) {
        setIsPaused((p) => {
          isPausedRef.current = !p
          return !p
        })
      }
    }
    const onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') inputRef.current.left = false
      if (e.code === 'ArrowRight' || e.code === 'KeyD') inputRef.current.right = false
      if (e.code === 'Space' || e.code === 'KeyZ') inputRef.current.fire = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [gameStarted, gameOver])

  const getGameXFromClientX = (clientX) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = WIDTH / rect.width
    return (clientX - rect.left) * scaleX
  }

  const handlePointerDown = (e) => {
    if (!gameStarted || gameOver || isPaused) return
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
    if (isTouch) {
      e.preventDefault()
      inputRef.current.autoFire = true
      inputRef.current.dragging = true
      const x = getGameXFromClientX(e.clientX)
      if (x != null) inputRef.current.dragX = x
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // ignore
      }
    } else {
      inputRef.current.fire = true
    }
  }

  const handlePointerMove = (e) => {
    if (!gameStarted || gameOver || isPaused) return
    if (!inputRef.current.dragging) return
    e.preventDefault()
    const x = getGameXFromClientX(e.clientX)
    if (x != null) inputRef.current.dragX = x
  }

  const handlePointerUp = () => {
    if (inputRef.current.dragging) {
      inputRef.current.dragging = false
      inputRef.current.dragX = null // 위치는 플레이어에 이미 반영됨, 자동 연사 유지
    } else {
      inputRef.current.fire = false
    }
  }

  const startGame = () => {
    stopLoop()
    savedScoreRef.current = false
    stateRef.current = createInitialState()
    const touchDevice =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    inputRef.current = {
      left: false,
      right: false,
      fire: false,
      dragX: null,
      autoFire: touchDevice,
      dragging: false,
    }
    setScore(0)
    setLives(3)
    setWave(1)
    setCombo(0)
    setGameOver(false)
    setCleared(false)
    isPausedRef.current = false
    setIsPaused(false)
    setStatusMessage('')
    setGameStarted(true)
    // 첫 프레임 그리기
    requestAnimationFrame(() => draw())
  }

  const resetGame = () => {
    stopLoop()
    stateRef.current = null
    setGameStarted(false)
    setGameOver(false)
    setCleared(false)
    isPausedRef.current = false
    setIsPaused(false)
    setScore(0)
    setLives(3)
    setWave(1)
    setCombo(0)
    setStatusMessage('')
    savedScoreRef.current = false
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0b1224'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2">갤러그 라이트</h2>
      <p className="text-sm text-gray-500 mb-4 text-center">
        PC: ←→ 이동, Space/Z 발사 · 모바일: 드래그 이동 + 자동 연사
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start">
        <div className="relative mx-auto">
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="rounded-lg shadow-lg border border-gray-700 bg-gray-900 touch-none max-w-full w-full sm:w-[360px]"
            style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <div className="text-white text-center px-4">
                <div className="text-xl font-bold mb-2">갤러그 라이트</div>
                <p className="text-sm text-gray-300 mb-4">5웨이브를 클리어하세요</p>
                <button
                  onClick={startGame}
                  className="px-5 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 font-semibold"
                >
                  시작
                </button>
              </div>
            </div>
          )}

          {isPaused && gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-white text-xl font-bold">일시정지</div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center rounded-lg">
              <div className="text-white text-center px-4">
                <div className="text-2xl font-bold mb-2">
                  {cleared ? '클리어!' : '게임 오버!'}
                </div>
                <div className="text-lg mb-4">점수: {score.toLocaleString()}</div>
                <button
                  onClick={startGame}
                  className="px-5 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 font-semibold"
                >
                  다시하기
                </button>
              </div>
            </div>
          )}

          {statusMessage && gameStarted && !gameOver && (
            <div className="absolute top-1/3 left-0 right-0 text-center pointer-events-none">
              <span className="inline-block bg-black/50 text-yellow-300 font-bold px-4 py-2 rounded-lg text-lg">
                {statusMessage}
              </span>
            </div>
          )}
        </div>

        <div className="flex sm:flex-col gap-2 w-full sm:w-40 justify-center">
          <div className="bg-gray-800 text-white px-4 py-2 rounded flex-1">
            <div className="text-xs text-gray-300">점수</div>
            <div className="text-xl font-bold">{score.toLocaleString()}</div>
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded flex-1">
            <div className="text-xs text-gray-300 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> 최고
            </div>
            <div className="text-xl font-bold">{Math.floor(bestScore).toLocaleString()}</div>
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded flex-1">
            <div className="text-xs text-gray-300">웨이브</div>
            <div className="text-xl font-bold">{wave} / {MAX_WAVES}</div>
          </div>
          <div className="bg-gray-800 text-white px-4 py-2 rounded flex-1">
            <div className="text-xs text-gray-300">목숨</div>
            <div className="text-xl font-bold">{lives}</div>
          </div>
          {combo > 1 && (
            <div className="bg-amber-600 text-white px-4 py-2 rounded flex-1">
              <div className="text-xs">콤보</div>
              <div className="text-xl font-bold">x{combo}</div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        {!gameStarted && (
          <button
            onClick={startGame}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            시작
          </button>
        )}
        {gameStarted && !gameOver && (
          <button
            onClick={() => {
              setIsPaused((p) => {
                isPausedRef.current = !p
                return !p
              })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? '계속' : '일시정지'}
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

      <p className="text-xs text-gray-400 text-center max-w-md">
        모바일에서는 화면을 드래그해 이동하고, 터치 조작 시 자동으로 발사됩니다.
      </p>
    </div>
  )
}

export default GalagaLite
