import { useState } from 'react'
import { ArrowLeft, Timer, History, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FastingTracker from '../components/fasting/FastingTracker'
import FastingHistory from '../components/fasting/FastingHistory'
import FastingTeamStatus from '../components/fasting/FastingTeamStatus'

const TABS = [
  { id: 'tracker', name: '단식 트래커', icon: Timer },
  { id: 'history', name: '내 기록', icon: History },
  { id: 'team', name: '직원 현황', icon: Users },
]

function FastingPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('tracker')
  // 트래커에서 시작/종료 시 기록·현황 탭을 갱신하기 위한 신호
  const [reloadSignal, setReloadSignal] = useState(0)

  const handleChange = () => setReloadSignal((n) => n + 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">단식 관리</h1>
            <p className="text-sm text-gray-500">건강을 위한 직원별 단식 스케줄 · 시간대별 몸의 변화</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.name}
              </button>
            )
          })}
        </div>

        {/* 내용 */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          {tab === 'tracker' && <FastingTracker onChange={handleChange} />}
          {tab === 'history' && <FastingHistory reloadSignal={reloadSignal} />}
          {tab === 'team' && <FastingTeamStatus reloadSignal={reloadSignal} />}
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
          ⚠️ 본 기능은 건강 정보 참고용이며 의학적 조언이 아닙니다. 장시간 단식(24시간 이상)이나 질환·복용약이
          있는 경우 반드시 의료 전문가와 상담하세요.
        </p>
      </div>
    </div>
  )
}

export default FastingPage
