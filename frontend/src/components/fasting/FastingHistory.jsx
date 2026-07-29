import { useState, useEffect } from 'react'
import { Trash2, Loader2, CalendarClock } from 'lucide-react'
import { fastingAPI } from '../../api/fasting'
import { formatHoursText, formatDateTime } from '../../utils/fastingFormat'

function durationHours(session) {
  if (!session.endTime) return null
  const ms = new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
  return ms / (1000 * 60 * 60)
}

function FastingHistory({ reloadSignal }) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await fastingAPI.getSessions()
      setSessions(data.sessions || [])
    } catch (e) {
      setError('기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [reloadSignal])

  const handleDelete = async (id) => {
    if (!window.confirm('이 단식 기록을 삭제할까요?')) return
    try {
      await fastingAPI.deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      window.alert(e.response?.data?.message || '삭제에 실패했습니다.')
    }
  }

  // 통계 계산 (종료된 세션 기준)
  const completed = sessions.filter((s) => s.endTime)
  const totalHours = completed.reduce((acc, s) => acc + (durationHours(s) || 0), 0)
  const bestHours = completed.reduce((max, s) => Math.max(max, durationHours(s) || 0), 0)
  const goalMet = completed.filter((s) => s.targetHours && (durationHours(s) || 0) >= s.targetHours).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        불러오는 중...
      </div>
    )
  }

  if (error) {
    return <p className="text-center text-red-600 py-8">{error}</p>
  }

  return (
    <div>
      {/* 통계 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{completed.length}</p>
          <p className="text-xs text-gray-600 mt-1">완료한 단식</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-teal-700">{formatHoursText(bestHours)}</p>
          <p className="text-xs text-gray-600 mt-1">최장 기록</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-cyan-700">{goalMet}</p>
          <p className="text-xs text-gray-600 mt-1">목표 달성</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">누적 단식 시간: {formatHoursText(totalHours)}</p>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CalendarClock className="w-10 h-10 mx-auto mb-2" />
          <p>아직 단식 기록이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const dh = durationHours(s)
            const isActive = !s.endTime
            const met = s.targetHours && dh !== null && dh >= s.targetHours
            return (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">
                      {isActive ? '진행 중' : formatHoursText(dh)}
                    </span>
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                        진행 중
                      </span>
                    )}
                    {s.targetHours && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          met ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        목표 {s.targetHours}h {met ? '달성' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {formatDateTime(s.startTime)}
                    {s.endTime ? ` → ${formatDateTime(s.endTime)}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default FastingHistory
