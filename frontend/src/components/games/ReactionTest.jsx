import { useState, useEffect, useRef, useCallback } from 'react'
import { RotateCcw, Zap } from 'lucide-react'
import { gamesAPI } from '../../api/games'

// idle: 시작 전 / waiting: 초록으로 바뀌길 기다리는 중 / ready: 초록 표시됨
// done: 측정 완료 / foul: 초록 전에 눌러 실격
const STATUS = {
  IDLE: 'idle',
  WAITING: 'waiting',
  READY: 'ready',
  DONE: 'done',
  FOUL: 'foul',
}

// 사람의 단순 반응 속도 하한은 대략 0.15초다. 그보다 빠른 값은 측정 오류로 보고 저장하지 않는다.
const MIN_VALID_TIME = 0.1

function ReactionTest() {
  const [status, setStatus] = useState(STATUS.IDLE)
  const [reactionTime, setReactionTime] = useState(null)
  const [times, setTimes] = useState([])
  const [bestTime, setBestTime] = useState(null)
  const timeoutRef = useRef(null)
  const startTimeRef = useRef(null)

  // 최고 기록 로드
  useEffect(() => {
    const loadBestTime = async () => {
      try {
        const result = await gamesAPI.getMyBestScore('REACTION')
        if (result.score) {
          setBestTime(result.score.score)
        }
      } catch (error) {
        console.error('최고 기록 로드 실패:', error)
      }
    }
    loadBestTime()
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const startTest = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setReactionTime(null)
    setStatus(STATUS.WAITING)

    // 1~5초 사이 랜덤 대기
    const waitTime = Math.random() * 4000 + 1000

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      startTimeRef.current = performance.now()
      setStatus(STATUS.READY)
    }, waitTime)
  }, [])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    startTimeRef.current = null
    setReactionTime(null)
    setStatus(STATUS.IDLE)
  }, [])

  // click(=mouseup) 이 아니라 pointerdown 으로 측정한다.
  // 누른 순간을 재야 정확하고, 누르고 있는 동안 이벤트가 반복 발생하지 않는다.
  const handlePointerDown = useCallback(() => {
    if (status === STATUS.IDLE || status === STATUS.DONE || status === STATUS.FOUL) {
      startTest()
      return
    }

    // 초록으로 바뀌기 전에 누르면 실격. 연타로 0초에 가까운 기록을 만드는 것을 막는다.
    if (status === STATUS.WAITING) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      startTimeRef.current = null
      setReactionTime(null)
      setStatus(STATUS.FOUL)
      return
    }

    if (status !== STATUS.READY || startTimeRef.current === null) return

    const timeInSeconds = (performance.now() - startTimeRef.current) / 1000
    startTimeRef.current = null
    setReactionTime(timeInSeconds)
    setStatus(STATUS.DONE)
    setTimes((prev) => [...prev, timeInSeconds].slice(-10))

    // 최고 기록 갱신 시 서버에 저장 (낮을수록 좋음)
    if (timeInSeconds >= MIN_VALID_TIME && (bestTime === null || timeInSeconds < bestTime)) {
      gamesAPI
        .saveScore('REACTION', timeInSeconds)
        .then((result) => {
          if (result.score) {
            setBestTime(result.score.score)
          }
        })
        .catch((error) => {
          console.error('점수 저장 실패:', error)
        })
    }
  }, [status, bestTime, startTest])

  const getAverageTime = () => {
    if (times.length === 0) return null
    const sum = times.reduce((a, b) => a + b, 0)
    return (sum / times.length).toFixed(3)
  }

  const areaColor = {
    [STATUS.WAITING]: 'bg-red-500',
    [STATUS.READY]: 'bg-green-500',
    [STATUS.DONE]: 'bg-blue-500',
    [STATUS.FOUL]: 'bg-amber-500',
    [STATUS.IDLE]: 'bg-gray-300',
  }[status]

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6">반응속도 테스트</h2>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6 w-full max-w-md">
        <div className="bg-gray-100 p-4 rounded text-center">
          <div className="text-sm text-gray-600">최고 기록</div>
          <div className="text-xl font-bold">
            {bestTime ? `${bestTime.toFixed(3)}초` : '-'}
          </div>
        </div>
        <div className="bg-gray-100 p-4 rounded text-center">
          <div className="text-sm text-gray-600">평균</div>
          <div className="text-xl font-bold">
            {getAverageTime() ? `${getAverageTime()}초` : '-'}
          </div>
        </div>
        <div className="bg-gray-100 p-4 rounded text-center">
          <div className="text-sm text-gray-600">시도 횟수</div>
          <div className="text-xl font-bold">{times.length}</div>
        </div>
      </div>

      {/* 게임 영역 */}
      <div
        className={`w-full max-w-md h-64 rounded-lg flex items-center justify-center cursor-pointer transition-colors select-none touch-none ${areaColor}`}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {status === STATUS.WAITING && (
          <div className="text-white text-xl font-bold">대기 중...</div>
        )}
        {status === STATUS.READY && (
          <div className="text-white text-xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            지금 누르세요!
          </div>
        )}
        {status === STATUS.FOUL && (
          <div className="text-white text-center px-6">
            <div className="text-2xl font-bold mb-2">너무 빨리 눌렀습니다</div>
            <div className="text-sm">초록색으로 바뀐 뒤에 누르세요. 다시 하려면 여기를 누르세요.</div>
          </div>
        )}
        {status === STATUS.DONE && reactionTime !== null && (
          <div className="text-white text-center">
            <div className="text-3xl font-bold mb-2">{reactionTime.toFixed(3)}초</div>
            <div className="text-sm">
              {reactionTime < MIN_VALID_TIME
                ? '기록으로 인정되지 않는 시간입니다'
                : reactionTime < 0.2
                ? '엄청 빠르네요! 🚀'
                : reactionTime < 0.3
                ? '빠릅니다! ⚡'
                : reactionTime < 0.5
                ? '좋습니다! 👍'
                : '조금 더 연습해보세요 💪'}
            </div>
          </div>
        )}
        {status === STATUS.IDLE && (
          <div className="text-gray-600 text-xl font-bold">시작하려면 누르세요</div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={startTest}
          disabled={status === STATUS.WAITING || status === STATUS.READY}
          className="px-6 py-3 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          시작
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          <RotateCcw className="w-4 h-4" />
          리셋
        </button>
      </div>

      {/* 최근 기록 */}
      {times.length > 0 && (
        <div className="mt-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-2">최근 기록</h3>
          <div className="bg-gray-100 p-4 rounded max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {times.slice().reverse().map((time, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white rounded text-sm font-mono"
                >
                  {time.toFixed(3)}초
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 mt-4 text-center">
        화면이 초록색으로 바뀌면 즉시 누르세요. 그 전에 누르면 실격입니다.
      </p>
    </div>
  )
}

export default ReactionTest
