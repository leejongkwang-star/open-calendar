import { useState, useEffect } from 'react'
import { Loader2, Users, Flame } from 'lucide-react'
import { fastingAPI } from '../../api/fasting'
import { getCurrentStageIndex, FASTING_STAGES } from '../../data/fastingStages'
import { formatHoursText, formatDateTime } from '../../utils/fastingFormat'

function FastingTeamStatus({ reloadSignal }) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await fastingAPI.getTeamStatus()
      setStatus(data.status || [])
    } catch (e) {
      setError('현황을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [reloadSignal])

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
      <div className="flex items-center gap-2 mb-4 text-gray-700">
        <Users className="w-5 h-5" />
        <h3 className="font-bold">지금 단식 중인 직원 ({status.length}명)</h3>
      </div>

      {status.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Flame className="w-10 h-10 mx-auto mb-2" />
          <p>현재 단식 중인 직원이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {status
            .slice()
            .sort((a, b) => b.elapsedHours - a.elapsedHours)
            .map((s) => {
              const stage = FASTING_STAGES[getCurrentStageIndex(s.elapsedHours)]
              return (
                <li
                  key={s.sessionId}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    s.isMe ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${stage.color}22` }}
                  >
                    {stage.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{s.userName}</span>
                      <span className="text-xs text-gray-400">({s.employeeNumber})</span>
                      {s.isMe && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-medium">
                          나
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {stage.short} · {formatDateTime(s.startTime)} 시작
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-bold text-gray-800">{formatHoursText(s.elapsedHours)}</p>
                    {s.targetHours && (
                      <p className="text-xs text-gray-500">목표 {s.targetHours}h</p>
                    )}
                  </div>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}

export default FastingTeamStatus
