import { useState, useEffect, useRef } from 'react'
import { RotateCcw, Zap } from 'lucide-react'

function ReactionTest() {
  const [waiting, setWaiting] = useState(false)
  const [ready, setReady] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [reactionTime, setReactionTime] = useState(null)
  const [times, setTimes] = useState([])
  const [startTime, setStartTime] = useState(null)
  const timeoutRef = useRef(null)
  const startTimeRef = useRef(null)

  const getBestTime = () => {
    const saved = localStorage.getItem('reaction_best_time')
    return saved ? parseFloat(saved) : null
  }

  const saveBestTime = (time) => {
    const best = getBestTime()
    if (!best || time < best) {
      localStorage.setItem('reaction_best_time', time.toString())
    }
  }

  const [bestTime, setBestTime] = useState(getBestTime())

  const startTest = () => {
    setWaiting(true)
    setReady(false)
    setClicked(false)
    setReactionTime(null)
    
    // 1~5초 사이 랜덤 대기
    const waitTime = Math.random() * 4000 + 1000
    
    timeoutRef.current = setTimeout(() => {
      setWaiting(false)
      setReady(true)
      startTimeRef.current = Date.now()
      setStartTime(Date.now())
    }, waitTime)
  }

  const handleClick = () => {
    if (!ready || clicked) return
    
    const endTime = Date.now()
    const time = endTime - startTimeRef.current
    const timeInSeconds = time / 1000
    
    setClicked(true)
    setReactionTime(timeInSeconds)
    setTimes(prev => {
      const newTimes = [...prev, timeInSeconds]
      if (newTimes.length > 10) newTimes.shift()
      saveBestTime(timeInSeconds)
      setBestTime(getBestTime())
      return newTimes
    })
  }

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setWaiting(false)
    setReady(false)
    setClicked(false)
    setReactionTime(null)
    setStartTime(null)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getAverageTime = () => {
    if (times.length === 0) return null
    const sum = times.reduce((a, b) => a + b, 0)
    return (sum / times.length).toFixed(3)
  }

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
        className={`w-full max-w-md h-64 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
          waiting
            ? 'bg-red-500'
            : ready && !clicked
            ? 'bg-green-500'
            : clicked
            ? 'bg-blue-500'
            : 'bg-gray-300'
        }`}
        onClick={handleClick}
      >
        {waiting && (
          <div className="text-white text-xl font-bold">대기 중...</div>
        )}
        {ready && !clicked && (
          <div className="text-white text-xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6" />
            클릭하세요!
          </div>
        )}
        {clicked && reactionTime !== null && (
          <div className="text-white text-center">
            <div className="text-3xl font-bold mb-2">{reactionTime.toFixed(3)}초</div>
            <div className="text-sm">
              {reactionTime < 0.2
                ? '엄청 빠르네요! 🚀'
                : reactionTime < 0.3
                ? '빠릅니다! ⚡'
                : reactionTime < 0.5
                ? '좋습니다! 👍'
                : '조금 더 연습해보세요 💪'}
            </div>
          </div>
        )}
        {!waiting && !ready && !clicked && (
          <div className="text-gray-600 text-xl font-bold">시작하려면 클릭하세요</div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={startTest}
          disabled={waiting || ready}
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
        화면이 초록색으로 바뀌면 즉시 클릭하세요!
      </p>
    </div>
  )
}

export default ReactionTest

