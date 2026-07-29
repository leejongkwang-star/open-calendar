import { FASTING_STAGES } from '../../data/fastingStages'
import { formatHoursText } from '../../utils/fastingFormat'

// 단식 시간대별 신체 변화 타임라인
// elapsedHours: 현재 경과 시간 (진행 중이 아니면 null → 안내용 전체 표시)
// currentStageIndex: 현재 단계 인덱스 (진행 중이 아니면 -1)
function FastingTimeline({ elapsedHours = null, currentStageIndex = -1 }) {
  const isTracking = elapsedHours !== null

  return (
    <div className="relative">
      <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-gray-200" aria-hidden="true" />

      <ul className="space-y-4">
        {FASTING_STAGES.map((stage, idx) => {
          const reached = isTracking && idx <= currentStageIndex
          const isCurrent = isTracking && idx === currentStageIndex

          return (
            <li key={stage.hour} className="relative flex gap-4">
              {/* 시간 노드 */}
              <div
                className={`z-10 flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xl border-2 transition-all ${
                  isCurrent
                    ? 'scale-110 shadow-lg'
                    : reached
                    ? ''
                    : 'grayscale opacity-60'
                }`}
                style={{
                  backgroundColor: reached || isCurrent ? stage.color : '#f3f4f6',
                  borderColor: reached || isCurrent ? stage.color : '#e5e7eb',
                }}
              >
                <span>{stage.emoji}</span>
              </div>

              {/* 내용 카드 */}
              <div
                className={`flex-1 rounded-lg border p-4 transition-all ${
                  isCurrent
                    ? 'border-transparent shadow-md ring-2'
                    : 'border-gray-200 bg-white'
                }`}
                style={
                  isCurrent
                    ? { backgroundColor: `${stage.color}12`, boxShadow: `0 0 0 2px ${stage.color}` }
                    : undefined
                }
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.hour}시간
                  </span>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{stage.title}</h3>
                  {isCurrent && (
                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full bg-red-500 animate-pulse">
                      현재
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">{stage.body}</p>

                <ul className="flex flex-wrap gap-1.5">
                  {stage.details.map((d, i) => (
                    <li
                      key={i}
                      className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700"
                    >
                      {d}
                    </li>
                  ))}
                </ul>

                {isCurrent && elapsedHours !== null && (
                  <p className="mt-2 text-xs font-medium" style={{ color: stage.color }}>
                    이 단계 진입 후 {formatHoursText(Math.max(0, elapsedHours - stage.hour))} 경과
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default FastingTimeline
