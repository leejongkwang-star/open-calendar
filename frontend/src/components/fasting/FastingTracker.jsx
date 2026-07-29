import { useState, useEffect, useRef } from 'react'
import { Play, Square, Clock, Target, Loader2 } from 'lucide-react'
import { fastingAPI } from '../../api/fasting'
import { FASTING_STAGES, getCurrentStageIndex, getNextStage } from '../../data/fastingStages'
import { formatClock, formatHoursText, formatDateTime } from '../../utils/fastingFormat'
import FastingTimeline from './FastingTimeline'

const TARGET_PRESETS = [12, 16, 18, 24, 36]

function FastingTracker({ onChange }) {
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [targetHours, setTargetHours] = useState(16)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)

  const loadActive = async () => {
    try {
      const data = await fastingAPI.getActive()
      setActiveSession(data.session)
    } catch (e) {
      setError('단식 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActive()
  }, [])

  // 진행 중일 때 1초마다 타이머 갱신
  useEffect(() => {
    if (activeSession) {
      setNow(Date.now())
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeSession])

  const handleStart = async () => {
    setBusy(true)
    setError('')
    try {
      const data = await fastingAPI.start({ targetHours })
      setActiveSession(data.session)
      onChange?.()
    } catch (e) {
      setError(e.response?.data?.message || '단식 시작에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleStop = async () => {
    if (!window.confirm('단식을 종료하시겠습니까? 기록에 저장됩니다.')) return
    setBusy(true)
    setError('')
    try {
      const data = await fastingAPI.stop()
      setActiveSession(null)
      onChange?.()
      const hours = data.durationHours ?? 0
      window.alert(`단식을 종료했습니다! 총 ${formatHoursText(hours)} 단식했습니다. 👏`)
    } catch (e) {
      setError(e.response?.data?.message || '단식 종료에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        불러오는 중...
      </div>
    )
  }

  // 진행 중이 아닐 때: 시작 화면
  if (!activeSession) {
    return (
      <div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white text-center shadow-lg">
          <div className="text-5xl mb-3">⏱️</div>
          <h2 className="text-2xl font-bold mb-2">단식을 시작해볼까요?</h2>
          <p className="text-emerald-50 mb-6 text-sm">
            시작 버튼을 누르면 시간이 자동으로 기록되고, 시간대별로 몸에서 일어나는 변화를 확인할 수 있어요.
          </p>

          <div className="mb-6">
            <p className="text-sm font-medium text-emerald-50 mb-3 flex items-center justify-center gap-1">
              <Target className="w-4 h-4" /> 목표 시간 선택
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TARGET_PRESETS.map((h) => (
                <button
                  key={h}
                  onClick={() => setTargetHours(h)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    targetHours === h
                      ? 'bg-white text-emerald-700 shadow-md scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {h}시간
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={busy}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60 disabled:hover:scale-100"
          >
            {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
            단식 시작
          </button>
        </div>

        {error && <p className="mt-4 text-center text-red-600 text-sm">{error}</p>}

        {/* 안내용 타임라인 */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-1">시간대별 단식 효과</h3>
          <p className="text-sm text-gray-500 mb-4">
            단식을 시작하면 각 단계가 하이라이트됩니다. 아래는 전체 과정 미리보기예요.
          </p>
          <FastingTimeline elapsedHours={null} currentStageIndex={-1} />
        </div>
      </div>
    )
  }

  // 진행 중일 때: 트래커 화면
  const startMs = new Date(activeSession.startTime).getTime()
  const elapsedMs = now - startMs
  const elapsedHours = elapsedMs / (1000 * 60 * 60)
  const currentStageIndex = getCurrentStageIndex(elapsedHours)
  const currentStage = FASTING_STAGES[currentStageIndex]
  const next = getNextStage(elapsedHours)
  const target = activeSession.targetHours

  const targetProgress = target ? Math.min(100, (elapsedHours / target) * 100) : null

  return (
    <div>
      {/* 타이머 카드 */}
      <div
        className="rounded-2xl p-8 text-white text-center shadow-lg transition-colors"
        style={{ background: `linear-gradient(135deg, ${currentStage.color}, ${currentStage.color}cc)` }}
      >
        <div className="flex items-center justify-center gap-2 text-sm font-medium opacity-90 mb-2">
          <Clock className="w-4 h-4" />
          {formatDateTime(activeSession.startTime)} 시작
        </div>

        <div className="text-5xl sm:text-6xl font-bold font-mono tracking-tight mb-2">
          {formatClock(elapsedMs)}
        </div>
        <p className="text-white/90 text-sm mb-4">
          {formatHoursText(elapsedHours)} 단식 중
        </p>

        {/* 현재 단계 */}
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-4">
          <span className="text-2xl">{currentStage.emoji}</span>
          <span className="font-semibold">{currentStage.short}</span>
        </div>

        {/* 목표 진행률 */}
        {target && (
          <div className="max-w-md mx-auto mb-2">
            <div className="flex justify-between text-xs text-white/90 mb-1">
              <span>목표 {target}시간</span>
              <span>{Math.floor(targetProgress)}%</span>
            </div>
            <div className="h-2.5 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            {targetProgress >= 100 && (
              <p className="mt-2 text-sm font-bold">🎉 목표 달성! 계속 이어가거나 종료할 수 있어요.</p>
            )}
          </div>
        )}

        {/* 다음 단계 안내 */}
        {next && (
          <p className="text-xs text-white/80 mt-3">
            다음 단계 <b>{next.stage.short}</b> 까지 {formatHoursText(next.hoursUntil)} 남음
          </p>
        )}

        <div className="mt-6">
          <button
            onClick={handleStop}
            disabled={busy}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-800 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Square className="w-5 h-5 fill-current" />}
            단식 종료
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-center text-red-600 text-sm">{error}</p>}

      {/* 현재 단계 상세 */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="text-xl">{currentStage.emoji}</span>
          지금 몸에서 일어나는 일: {currentStage.title}
        </h3>
        <p className="text-sm text-gray-600">{currentStage.body}</p>
      </div>

      {/* 시간대별 타임라인 */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">시간대별 단식 효과</h3>
        <FastingTimeline elapsedHours={elapsedHours} currentStageIndex={currentStageIndex} />
      </div>
    </div>
  )
}

export default FastingTracker
