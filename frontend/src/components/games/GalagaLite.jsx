import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { gamesAPI } from '../../api/games'
import { HEIGHT, MAX_STAGES, WIDTH } from './galaga/constants'
import { drainEvents, unlockAudio } from './galaga/audio'
import { createInitialState, updateGame } from './galaga/engine'
import { renderGame } from './galaga/render'

function GalagaLite() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const inputRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    fire: false,
    focus: false,
    bomb: false,
    dragX: null,
    dragY: null,
    autoFire: false,
    dragging: false,
    dragDx: 0,
    dragDy: 0,
    touchX: 0,
    touchY: 0,
  })
  const rafRef = useRef(null)
  const lastTimeRef = useRef(0)
  const savedScoreRef = useRef(false)
  const isPausedRef = useRef(false)
  const hudAccRef = useRef(0)
  const soundOnRef = useRef(true)

  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [lives, setLives] = useState(4)
  const [bombs, setBombs] = useState(3)
  const [stage, setStage] = useState(1)
  const [graze, setGraze] = useState(0)
  const [soundOn, setSoundOn] = useState(true)

  useEffect(() => {
    const loadBestScore = async () => {
      try {
        const result = await gamesAPI.getMyBestScore('GALAGA')
        if (result.score) setBestScore(result.score.score)
      } catch (error) {
        console.error('최고 기록 로드 실패:', error)
      }
    }
    loadBestScore()
  }, [])

  const syncHud = useCallback((state) => {
    setScore(state.score)
    setLives(state.lives)
    setBombs(state.bombs)
    setStage(state.stage)
    setGraze(state.graze)
  }, [])

  const saveScoreIfNeeded = useCallback(async (finalScore, state) => {
    if (savedScoreRef.current || finalScore <= 0) return
    savedScoreRef.current = true
    try {
      const result = await gamesAPI.saveScore('GALAGA', finalScore, {
        stage: state.stage,
        cleared: state.status === 'cleared',
        livesLeft: state.lives,
        graze: state.graze,
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
    ctx.imageSmoothingEnabled = false
    renderGame(ctx, state, { focus: inputRef.current.focus })
  }, [])

  const loop = useCallback((time) => {
    const state = stateRef.current
    if (!state) return

    const rawDt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016
    lastTimeRef.current = time
    const dt = Math.min(rawDt, 0.032)

    if (!isPausedRef.current && state.status === 'playing') {
      try {
        const input = inputRef.current
        updateGame(state, dt, {
          left: input.left,
          right: input.right,
          up: input.up,
          down: input.down,
          fire: input.autoFire || input.fire,
          focus: input.focus,
          bomb: input.bomb,
          dragX: input.dragX,
          dragY: input.dragY,
          dragDx: input.dragDx,
          dragDy: input.dragDy,
        })
        input.bomb = false
        input.dragDx = 0
        input.dragDy = 0
        if (soundOnRef.current) drainEvents(state)
        else if (state.events) state.events.length = 0

        hudAccRef.current += dt
        if (hudAccRef.current >= 0.15) {
          hudAccRef.current = 0
          syncHud(state)
        }

        if (state.status === 'gameOver') {
          syncHud(state)
          setGameOver(true)
          saveScoreIfNeeded(state.score, state)
        } else if (state.status === 'cleared') {
          syncHud(state)
          setCleared(true)
          setGameOver(true)
          saveScoreIfNeeded(state.score, state)
        }
      } catch (err) {
        console.error('게임 루프 오류:', err)
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
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        inputRef.current.up = true
        e.preventDefault()
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        inputRef.current.down = true
        e.preventDefault()
      }
      if (e.code === 'Space' || e.code === 'KeyZ') {
        inputRef.current.fire = true
        e.preventDefault()
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        inputRef.current.focus = true
        e.preventDefault()
      }
      if ((e.code === 'KeyX' || e.code === 'KeyC') && gameStarted && !gameOver) {
        inputRef.current.bomb = true
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
      if (e.code === 'ArrowUp' || e.code === 'KeyW') inputRef.current.up = false
      if (e.code === 'ArrowDown' || e.code === 'KeyS') inputRef.current.down = false
      if (e.code === 'Space' || e.code === 'KeyZ') inputRef.current.fire = false
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') inputRef.current.focus = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [gameStarted, gameOver])

  const getGamePos = (clientX, clientY) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (WIDTH / rect.width),
      y: (clientY - rect.top) * (HEIGHT / rect.height),
    }
  }

  const handlePointerDown = (e) => {
    if (!gameStarted || gameOver || isPaused) return
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen'
    if (isTouch) {
      e.preventDefault()
      inputRef.current.autoFire = true
      inputRef.current.dragging = true
      const pos = getGamePos(e.clientX, e.clientY)
      if (pos) {
        inputRef.current.touchX = pos.x
        inputRef.current.touchY = pos.y
      }
      inputRef.current.dragDx = 0
      inputRef.current.dragDy = 0
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
    const pos = getGamePos(e.clientX, e.clientY)
    if (!pos) return
    inputRef.current.dragDx += pos.x - inputRef.current.touchX
    inputRef.current.dragDy += pos.y - inputRef.current.touchY
    inputRef.current.touchX = pos.x
    inputRef.current.touchY = pos.y
  }

  const handlePointerUp = () => {
    if (inputRef.current.dragging) {
      inputRef.current.dragging = false
      inputRef.current.dragDx = 0
      inputRef.current.dragDy = 0
    } else {
      inputRef.current.fire = false
    }
  }

  const startGame = () => {
    unlockAudio()
    stopLoop()
    savedScoreRef.current = false
    stateRef.current = createInitialState()
    const touchDevice =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    inputRef.current = {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
      focus: false,
      bomb: false,
      dragX: null,
      dragY: null,
      dragDx: 0,
      dragDy: 0,
      touchX: 0,
      touchY: 0,
      autoFire: touchDevice,
      dragging: false,
    }
    setScore(0)
    setLives(4)
    setBombs(3)
    setStage(1)
    setGraze(0)
    setGameOver(false)
    setCleared(false)
    isPausedRef.current = false
    setIsPaused(false)
    setGameStarted(true)
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
    setLives(4)
    setBombs(3)
    setStage(1)
    setGraze(0)
    savedScoreRef.current = false
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#08060f'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-1 tracking-wide">탄막 슈팅</h2>
      <p className="text-sm text-gray-500 mb-4 text-center">
        8-BIT DANMAKU · 탄막 사이를 피하며 8스테이지를 돌파하세요
      </p>

      <div className="w-full max-w-md mb-4">
        <div className="relative mx-auto w-fit">
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="rounded-sm shadow-lg border-2 border-zinc-700 bg-black touch-none max-w-full"
            style={{
              width: 'min(100%, 384px)',
              aspectRatio: `${WIDTH} / ${HEIGHT}`,
              touchAction: 'none',
              imageRendering: 'pixelated',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-white text-center px-4 font-mono">
                <div className="text-lg font-bold mb-1 text-yellow-300">STAR HELL</div>
                <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                  작은 히트박스로 탄막을 피하세요
                  <br />
                  8 STAGE · 4 LIFE · BOMB
                </p>
                <button
                  onClick={startGame}
                  className="px-5 py-2 bg-yellow-400 text-black rounded-sm hover:bg-yellow-300 font-bold"
                >
                  START
                </button>
              </div>
            </div>
          )}

          {isPaused && gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-yellow-300 text-xl font-mono font-bold">PAUSE</div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-white text-center px-4 font-mono">
                <div className="text-2xl font-bold mb-2 text-yellow-300">
                  {cleared ? 'ALL CLEAR' : 'GAME OVER'}
                </div>
                <div className="text-sm mb-1">SCORE {score.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mb-4">STAGE {stage} · GRAZE {graze}</div>
                <button
                  onClick={startGame}
                  className="px-5 py-2 bg-yellow-400 text-black rounded-sm hover:bg-yellow-300 font-bold"
                >
                  RETRY
                </button>
              </div>
            </div>
          )}

          {gameStarted && !gameOver && (
            <button
              type="button"
              aria-label="폭탄"
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                inputRef.current.bomb = true
              }}
              className="absolute right-2 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-black shadow-lg active:bg-amber-400 sm:h-12 sm:w-12"
              style={{ bottom: '28px', touchAction: 'manipulation' }}
            >
              BOMB
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center font-mono text-xs">
          <div className="rounded bg-zinc-900 px-2 py-2 border border-zinc-700">
            <div className="text-[10px] text-zinc-500">SCORE</div>
            <div className="text-yellow-300 font-bold tabular-nums">{Math.floor(score).toLocaleString()}</div>
          </div>
          <div className="rounded bg-zinc-900 px-2 py-2 border border-zinc-700">
            <div className="text-[10px] text-zinc-500">BEST</div>
            <div className="text-white font-bold tabular-nums">{Math.floor(bestScore).toLocaleString()}</div>
          </div>
          <div className="rounded bg-zinc-900 px-2 py-2 border border-zinc-700">
            <div className="text-[10px] text-zinc-500">STAGE</div>
            <div className="text-white font-bold">{stage}/{MAX_STAGES}</div>
          </div>
          <div className="rounded bg-zinc-900 px-2 py-2 border border-zinc-700">
            <div className="text-[10px] text-zinc-500">LIFE·BOMB</div>
            <div className="text-white font-bold">{lives} / {bombs}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-2">
        {!gameStarted && (
          <button
            onClick={startGame}
            className="px-4 py-2 bg-yellow-400 text-black rounded-sm hover:bg-yellow-300 font-bold"
          >
            시작
          </button>
        )}
        {gameStarted && !gameOver && (
          <>
            <button
              onClick={() => {
                setIsPaused((p) => {
                  isPausedRef.current = !p
                  return !p
                })
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-sm hover:bg-gray-600"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? '계속' : '일시정지'}
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault()
                inputRef.current.bomb = true
              }}
              className="hidden sm:inline-flex px-4 py-2 bg-amber-500 text-black rounded-sm hover:bg-amber-400 font-bold"
            >
              BOMB
            </button>
            <button
              onClick={() => {
                const next = !soundOnRef.current
                soundOnRef.current = next
                setSoundOn(next)
                if (next) unlockAudio()
              }}
              className="p-2 bg-gray-700 text-white rounded-sm hover:bg-gray-600"
              aria-label={soundOn ? '사운드 끄기' : '사운드 켜기'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </>
        )}
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-sm hover:bg-gray-600"
        >
          <RotateCcw className="w-4 h-4" />
          리셋
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center max-w-md leading-relaxed">
        PC: 방향키/WASD 이동 · Shift 저속(히트박스) · Z/Space 발사 · X 봄 · P 일시정지
        <br />
        모바일: 화면 아래를 밀면 이동 · 오른쪽 아래 BOMB로 탄막 제거
      </p>
    </div>
  )
}

export default GalagaLite
