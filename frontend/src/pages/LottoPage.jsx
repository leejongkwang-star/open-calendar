import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clover, RefreshCw, Sparkles, TrendingUp, Snowflake, Scale, Shuffle } from 'lucide-react'
import { lottoAPI } from '../api/lotto'

/* ---------------- 랜덤 유틸 ---------------- */
// crypto 기반 0~1 실수 (Math.random보다 균등한 분포)
function secureRandomFloat() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(1)
    crypto.getRandomValues(arr)
    return arr[0] / 4294967296 // 2^32
  }
  return Math.random()
}

/* ---------------- 번호 생성 핵심 로직 ---------------- */
// 가중치 함수에 따라 중복 없이 6개 번호를 추첨
function pickWeighted(numberStats, weightFn) {
  const available = numberStats.map((s) => ({
    number: s.number,
    w: Math.max(weightFn(s), 0.0001),
  }))
  const picked = []

  for (let k = 0; k < 6; k++) {
    const totalW = available.reduce((acc, item) => acc + item.w, 0)
    let r = secureRandomFloat() * totalW
    let idx = 0
    for (; idx < available.length; idx++) {
      r -= available[idx].w
      if (r <= 0) break
    }
    if (idx >= available.length) idx = available.length - 1
    picked.push(available[idx].number)
    available.splice(idx, 1)
  }
  return picked.sort((a, b) => a - b)
}

// 연속된 숫자의 최대 길이 (예: 12,13,14 -> 3)
function maxConsecutive(nums) {
  let best = 1
  let cur = 1
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1] + 1) {
      cur += 1
      best = Math.max(best, cur)
    } else {
      cur = 1
    }
  }
  return best
}

// 5개 구간(1-9,10-19,20-29,30-39,40-45)에 걸친 분포 개수
function distinctRanges(nums) {
  const set = new Set(nums.map((n) => Math.min(Math.floor(n / 10), 4)))
  return set.size
}

// 전략별 번호 생성
function generateSet(strategy, numberStats) {
  switch (strategy) {
    case 'frequency':
      // 역대 전체에서 많이 나온 번호에 가중
      return pickWeighted(numberStats, (s) => s.count + 1)

    case 'hot':
      // 최근 50회 자주 나온 핫넘버에 강하게 가중
      return pickWeighted(numberStats, (s) => Math.pow(s.recentCount + 1, 2))

    case 'cold':
      // 오래 안 나온(미출현 기간이 긴) 번호에 가중 — "나올 때가 됐다"
      return pickWeighted(numberStats, (s) => s.gap + 1)

    case 'balanced': {
      // 1등 당첨 조합의 통계적 특성을 모방:
      // 합계 100~175, 홀짝 2~4개, 구간 3개 이상, 연속수 2개 이하
      for (let attempt = 0; attempt < 400; attempt++) {
        const nums = pickWeighted(numberStats, (s) => s.count + 1)
        const sum = nums.reduce((a, b) => a + b, 0)
        const odd = nums.filter((n) => n % 2 === 1).length
        if (
          sum >= 100 &&
          sum <= 175 &&
          odd >= 2 &&
          odd <= 4 &&
          distinctRanges(nums) >= 3 &&
          maxConsecutive(nums) <= 2
        ) {
          return nums
        }
      }
      return pickWeighted(numberStats, (s) => s.count + 1)
    }

    case 'random':
    default:
      return pickWeighted(numberStats, () => 1)
  }
}

/* ---------------- 번호 색상 (동행복권 기준) ---------------- */
function ballColor(n) {
  if (n <= 10) return '#fbc400'
  if (n <= 20) return '#69c8f2'
  if (n <= 30) return '#ff7272'
  if (n <= 40) return '#aaaaaa'
  return '#b0d840'
}

function LottoBall({ n, size = 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-11 h-11 text-base'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold text-white shadow-md`}
      style={{ backgroundColor: ballColor(n) }}
    >
      {n}
    </div>
  )
}

/* ---------------- 전략 정의 ---------------- */
const STRATEGIES = [
  {
    id: 'balanced',
    name: 'AI 균형 조합',
    desc: '역대 1등 당첨 조합의 통계 특성(합계·홀짝·구간 분포)을 모방',
    icon: Scale,
  },
  {
    id: 'frequency',
    name: '빈도 가중',
    desc: '역대 전체에서 가장 많이 나온 번호에 가중치 부여',
    icon: TrendingUp,
  },
  {
    id: 'hot',
    name: '핫 넘버',
    desc: '최근 50회에서 자주 출현한 상승세 번호 위주',
    icon: Sparkles,
  },
  {
    id: 'cold',
    name: '콜드 넘버',
    desc: '오랫동안 안 나온 번호 위주 — 출현 주기 도래 기대',
    icon: Snowflake,
  },
  {
    id: 'random',
    name: '순수 랜덤',
    desc: '통계 미적용 완전 무작위 (비교용)',
    icon: Shuffle,
  },
]

export default function LottoPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [strategy, setStrategy] = useState('balanced')
  const [setCount, setSetCount] = useState(5)
  const [results, setResults] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await lottoAPI.getStats()
      setStats(data)
    } catch (err) {
      console.error('로또 통계 로드 실패:', err)
      setError('당첨번호 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = () => {
    if (!stats) return
    setIsGenerating(true)
    setResults([])

    // 살짝의 연출용 딜레이
    setTimeout(() => {
      const sets = []
      for (let i = 0; i < setCount; i++) {
        sets.push(generateSet(strategy, stats.numberStats))
      }
      setResults(sets)
      setIsGenerating(false)
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }, 600)
  }

  // 핫/콜드 상위 번호
  const hotNumbers = stats
    ? [...stats.numberStats].sort((a, b) => b.recentCount - a.recentCount).slice(0, 6)
    : []
  const coldNumbers = stats
    ? [...stats.numberStats].sort((a, b) => b.gap - a.gap).slice(0, 6)
    : []
  const maxCount = stats
    ? Math.max(...stats.numberStats.map((s) => s.count))
    : 1

  return (
    <div className="h-full">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/calendar')} className="btn-secondary flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clover className="w-6 h-6 text-green-600" />
            로또 번호 추천기
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            역대 전체 당첨번호를 분석한 통계 기법으로 번호를 추천합니다.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
          <RefreshCw className="w-10 h-10 mx-auto mb-4 text-primary-600 animate-spin" />
          <p className="text-gray-600">역대 당첨번호를 분석하는 중입니다...</p>
          <p className="text-xs text-gray-400 mt-1">최초 1회는 다소 시간이 걸릴 수 있습니다.</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadStats} className="btn-primary">
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 옵션 + 통계 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 최신 회차 */}
            {stats?.latestDraw && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500">
                    제 {stats.latestDraw.drwNo}회 ({stats.latestDraw.date})
                  </h2>
                  <span className="text-xs text-gray-400">총 {stats.totalDraws}회 분석</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {stats.latestDraw.numbers.map((n) => (
                    <LottoBall key={n} n={n} size="sm" />
                  ))}
                  <span className="text-gray-400 mx-1">+</span>
                  <LottoBall n={stats.latestDraw.bonus} size="sm" />
                </div>
              </div>
            )}

            {/* 옵션 */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">추천 전략</h2>
              <div className="space-y-2">
                {STRATEGIES.map((s) => {
                  const Icon = s.icon
                  const active = strategy === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        active
                          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                        <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-snug">{s.desc}</p>
                    </button>
                  )
                })}
              </div>

              {/* 세트 수 */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  생성할 게임 수: {setCount}개
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={setCount}
                  onChange={(e) => setSetCount(parseInt(e.target.value, 10))}
                  className="w-full accent-primary-600"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full btn-primary flex items-center justify-center py-3 text-lg font-semibold mt-4 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Clover className="w-5 h-5 mr-2" />
                    번호 생성!
                  </>
                )}
              </button>
            </div>

            {/* 핫/콜드 통계 */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-orange-500" /> 핫 넘버 (최근 50회)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {hotNumbers.map((s) => (
                    <LottoBall key={s.number} n={s.number} size="sm" />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <Snowflake className="w-4 h-4 text-blue-400" /> 콜드 넘버 (장기 미출현)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {coldNumbers.map((s) => (
                    <LottoBall key={s.number} n={s.number} size="sm" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 결과 + 빈도 차트 */}
          <div className="lg:col-span-2 space-y-6">
            <div
              ref={resultRef}
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 min-h-[280px]"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">추천 번호</h2>
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 py-16">
                  <Clover className="w-20 h-20 mb-4 opacity-40" />
                  <p>전략을 선택하고 번호를 생성해보세요!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((set, idx) => {
                    const sum = set.reduce((a, b) => a + b, 0)
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 animate-fade-in"
                        style={{ animationDelay: `${idx * 0.08}s` }}
                      >
                        <span className="w-6 text-sm font-semibold text-gray-400 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {set.map((n) => (
                            <LottoBall key={n} n={n} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                          합 {sum}
                        </span>
                      </div>
                    )
                  })}
                  <p className="text-xs text-gray-400 text-center pt-2">
                    ※ 로또는 본질적으로 무작위 추첨입니다. 통계 기법은 재미를 위한 것이며 당첨을 보장하지 않습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 번호별 출현 빈도 차트 */}
            {stats && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">번호별 출현 빈도</h2>
                <div className="grid grid-cols-9 gap-1.5">
                  {stats.numberStats.map((s) => {
                    const heightPct = Math.round((s.count / maxCount) * 100)
                    return (
                      <div key={s.number} className="flex flex-col items-center" title={`${s.number}번: ${s.count}회`}>
                        <div className="w-full h-20 flex items-end">
                          <div
                            className="w-full rounded-t"
                            style={{
                              height: `${Math.max(heightPct, 5)}%`,
                              backgroundColor: ballColor(s.number),
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">{s.number}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-3">
                  <span>평균 당첨번호 합계: {stats.sum.avg}</span>
                  <span>
                    홀 {stats.oddEven.odd} : 짝 {stats.oddEven.even}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
