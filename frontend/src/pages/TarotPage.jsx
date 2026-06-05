import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { TAROT_CARDS } from '../data/tarotCards'
import '../styles/tarot.css'

const TEMP_MIN = 29.5
const TEMP_MAX = 37.0
const POSITIONS = ['과거', '현재', '미래']

/* ---------- 유틸 ---------- */
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pad2 = (n) => String(n).padStart(2, '0')
const imgSrc = (id) => `/tarot/cards/${pad2(id)}.jpg`

function tempToPercent(t) {
  const p = ((t - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100
  return Math.max(2, Math.min(98, p))
}
function tempColor(t) {
  if (t >= 36) return '#e85c79'
  if (t >= 34.5) return '#ec7a8e'
  if (t >= 31.5) return '#e7b27a'
  return '#7aa7d6'
}
function verdict(t) {
  if (t >= 36) return '가장 뜨거운 절정'
  if (t >= 34.5) return '확실히 타오르는 마음'
  if (t >= 33) return '따뜻하게 향하는 중'
  if (t >= 31.5) return '미지근하게 흔들리는 온도'
  if (t >= 30.5) return '서서히 식어가는 온도'
  return '차갑게 멀어진 온도'
}
function summaryData(cards) {
  const avg = cards.reduce((s, c) => s + c.temp, 0) / cards.length
  let text
  if (cards.length === 1) {
    text = cards[0].tempNote
  } else {
    const first = cards[0].temp
    const last = cards[cards.length - 1].temp
    const diff = last - first
    if (diff >= 1.5) {
      text = `과거의 ${first.toFixed(1)}°C에서 미래의 ${last.toFixed(1)}°C로, 관계의 온도가 다시 차오르는 흐름이에요. 식었던 마음이 회복되거나 더 깊어질 가능성이 보입니다.`
    } else if (diff <= -1.5) {
      text = `과거의 ${first.toFixed(1)}°C에서 미래의 ${last.toFixed(1)}°C로, 온도가 점점 내려가는 흐름이에요. 지금의 마음을 돌보고 속도를 조절할 시간이 필요해 보입니다.`
    } else {
      text = `${first.toFixed(1)}°C → ${last.toFixed(1)}°C, 큰 기복 없이 비슷한 온도를 유지하는 흐름이에요. 지금의 결을 부드럽게 이어가는 것이 어울립니다.`
    }
  }
  return { avg, text, label: cards.length === 1 ? '지금의 온도' : '관계의 종합 온도' }
}

export default function TarotPage() {
  const [screen, setScreen] = useState('intro') // intro | deck | reading
  const [spread, setSpread] = useState(1)
  const [question, setQuestion] = useState('')
  const [table, setTable] = useState([])
  const [picked, setPicked] = useState([])
  const [deckPhase, setDeckPhase] = useState('stacked') // stacked | dealing | ready
  const [deckWidth, setDeckWidth] = useState(900)
  const [flipped, setFlipped] = useState([])
  const [gauged, setGauged] = useState([])
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  )

  const deckRef = useRef(null)
  const timers = useRef([])

  /* ----- 모바일/데스크톱 감지 (덱 레이아웃 전환) ----- */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => () => clearTimers(), [])

  /* ----- 덱 너비 측정 (펼침 간격 계산용) ----- */
  useLayoutEffect(() => {
    if (screen !== 'deck') return
    const measure = () => {
      if (deckRef.current) setDeckWidth(deckRef.current.clientWidth || 900)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [screen])

  /* ----- 시작 → 덱 ----- */
  const startDeck = (e) => {
    e?.preventDefault()
    setQuestion(question.trim() || '지금 나의 연애운은 어떤가요?')
    setTable(shuffle(TAROT_CARDS)) // 전체 40장, 매번 새로 셔플
    setPicked([])
    setDeckPhase('stacked')
    setScreen('deck')
  }

  /* ----- 덱 진입 시 딜 애니메이션 ----- */
  useEffect(() => {
    if (screen !== 'deck') return
    clearTimers()
    setDeckPhase('stacked')
    const r1 = requestAnimationFrame(() =>
      requestAnimationFrame(() => setDeckPhase('dealing'))
    )
    const n = table.length
    const t = setTimeout(() => setDeckPhase('ready'), n * 28 + 700)
    timers.current.push(t)
    return () => cancelAnimationFrame(r1)
  }, [screen, table.length])

  const togglePick = (i) => {
    setPicked((prev) => {
      if (prev.includes(i)) return prev.filter((x) => x !== i)
      if (prev.length >= spread) return prev
      return [...prev, i]
    })
  }

  /* ----- 결과 보기 ----- */
  const goReading = () => {
    if (picked.length !== spread) return
    const count = picked.length
    setFlipped(new Array(count).fill(false))
    setGauged(new Array(count).fill(false))
    setScreen('reading')
  }

  /* ----- 리딩 등장 연출(뒤집기 + 게이지) ----- */
  useEffect(() => {
    if (screen !== 'reading') return
    clearTimers()
    picked.forEach((_, i) => {
      const t1 = setTimeout(() => {
        setFlipped((f) => {
          const n = f.slice()
          n[i] = true
          return n
        })
      }, 350 + i * 450)
      const t2 = setTimeout(() => {
        setGauged((g) => {
          const n = g.slice()
          n[i] = true
          return n
        })
      }, 900 + i * 450)
      timers.current.push(t1, t2)
    })
  }, [screen, picked])

  const reset = useCallback(() => {
    clearTimers()
    setScreen('intro')
    setPicked([])
  }, [])

  /* ----- 부채꼴 카드 위치 계산 ----- */
  const n = table.length
  const maxAngle = 62
  const spreadX = Math.max(7, Math.min(30, (deckWidth * 0.94) / Math.max(1, n)))

  const cardStyle = (i) => {
    const t = n <= 1 ? 0.5 : i / (n - 1)
    const angle = (t - 0.5) * 2 * maxAngle
    const x = (i - (n - 1) / 2) * spreadX
    const lift = -Math.cos((t - 0.5) * Math.PI) * 26
    return {
      '--tx': `${x}px`,
      '--ty': `${lift}px`,
      '--rot': `${angle}deg`,
      '--delay': `${i * 28}ms`,
      zIndex: picked.includes(i) ? 200 : i,
    }
  }

  const pickedCards = picked.map((i) => table[i])
  const summary = pickedCards.length ? summaryData(pickedCards) : null
  const deckHint =
    picked.length < spread
      ? isMobile
        ? spread === 1
          ? '옆으로 넘기며 마음이 가는 카드 한 장을 탭하세요'
          : `옆으로 넘기며 카드 ${spread}장을 탭하세요 (${picked.length}/${spread})`
        : spread === 1
          ? '마음이 가는 카드 한 장을 선택하세요'
          : `마음이 가는 카드 ${spread}장을 선택하세요 (${picked.length}/${spread})`
      : '준비됐어요. 아래 ‘결과 보기’를 눌러주세요'

  return (
    <div className="tarot-app">
      <div className="aurora" aria-hidden="true">
        <span className="orb orb--rose" />
        <span className="orb orb--plum" />
        <span className="orb orb--gold" />
      </div>

      <div className="stage">
        {/* 1. 시작 */}
        {screen === 'intro' && (
          <section className="screen screen--intro">
            <p className="eyebrow">사랑의 온도를 묻다</p>
            <h1 className="title">연애의 온도</h1>
            <p className="subtitle">
              마음 깊은 곳에 떠오른 그 사람, 혹은 그 관계를 떠올려 보세요.
              <br />
              질문을 마음에 담고 카드를 펼치면, 지금의 온도를 읽어 드릴게요.
            </p>

            <form className="ask" onSubmit={startDeck} autoComplete="off">
              <label className="ask__label" htmlFor="tarot-question">
                지금 가장 궁금한 것은 무엇인가요?
              </label>
              <input
                id="tarot-question"
                className="ask__input"
                type="text"
                maxLength={60}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="예) 그 사람의 지금 마음은 어떤가요?"
              />

              <div className="spread" role="radiogroup" aria-label="뽑을 카드 수">
                <button
                  type="button"
                  className={`spread__opt ${spread === 1 ? 'is-selected' : ''}`}
                  role="radio"
                  aria-checked={spread === 1}
                  onClick={() => setSpread(1)}
                >
                  <span className="spread__num">한 장</span>
                  <span className="spread__desc">지금 이 순간의 온도</span>
                </button>
                <button
                  type="button"
                  className={`spread__opt ${spread === 3 ? 'is-selected' : ''}`}
                  role="radio"
                  aria-checked={spread === 3}
                  onClick={() => setSpread(3)}
                >
                  <span className="spread__num">세 장</span>
                  <span className="spread__desc">과거 · 현재 · 미래의 흐름</span>
                </button>
              </div>

              <button type="submit" className="btn btn--primary">
                카드 펼치기
              </button>
            </form>
          </section>
        )}

        {/* 2. 덱 선택 */}
        {screen === 'deck' && (
          <section className="screen screen--deck">
            <h2 className="deck__title">마음이 이끄는 카드를 골라주세요</h2>
            <p className="deck__hint">{deckHint}</p>
            {isMobile ? (
              <div className="deck deck--strip">
                {table.map((card, i) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`cardstrip ${picked.includes(i) ? 'is-picked' : ''}`}
                    style={{ '--delay': `${i * 18}ms` }}
                    aria-label={`카드 ${i + 1}`}
                    onClick={() => togglePick(i)}
                  />
                ))}
              </div>
            ) : (
              <div
                ref={deckRef}
                className={`deck ${deckPhase === 'stacked' ? 'is-stacked is-dealing' : ''} ${
                  deckPhase === 'dealing' ? 'is-dealing' : ''
                }`}
              >
                {table.map((card, i) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`cardback ${picked.includes(i) ? 'is-picked' : ''}`}
                    style={cardStyle(i)}
                    aria-label={`카드 ${i + 1}`}
                    onClick={() => togglePick(i)}
                  />
                ))}
              </div>
            )}
            <div className="deck__actions">
              <button type="button" className="btn btn--ghost" onClick={reset}>
                처음으로
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={picked.length !== spread}
                onClick={goReading}
              >
                결과 보기
              </button>
            </div>
          </section>
        )}

        {/* 3. 리딩 결과 */}
        {screen === 'reading' && (
          <section className="screen screen--reading">
            <header className="reading__head">
              <p className="reading__q">{question}</p>
              {summary && (
                <div className="reading__summary">
                  <div className="summary__top">
                    <span className="summary__label">{summary.label}</span>
                    <span className="summary__temp" style={{ color: tempColor(summary.avg) }}>
                      {summary.avg.toFixed(1)}°C
                    </span>
                    <span className="summary__verdict">{verdict(summary.avg)}</span>
                  </div>
                  <p className="summary__text">{summary.text}</p>
                </div>
              )}
            </header>

            <div className={`reading__cards ${pickedCards.length === 3 ? 'is-three' : ''}`}>
              {pickedCards.map((card, i) => (
                <article className="result" key={card.id} style={{ animationDelay: `${i * 140}ms` }}>
                  {pickedCards.length === 3 && <div className="result__pos">{POSITIONS[i]}</div>}
                  <div className={`flip ${flipped[i] ? 'is-flipped' : ''}`}>
                    <div className="flip__inner">
                      <div className="flip__face flip__face--back" />
                      <div className="flip__face flip__face--front">
                        <img src={imgSrc(card.id)} alt={card.title} loading="lazy" />
                      </div>
                    </div>
                  </div>
                  <h3 className="result__title">{card.title}</h3>
                  <div className="gauge">
                    <div className="gauge__head">
                      <span className="gauge__cap">마음의 온도</span>
                      <span className="gauge__val" style={{ color: tempColor(card.temp) }}>
                        {card.temp.toFixed(1)}°C
                      </span>
                    </div>
                    <div className="gauge__track">
                      <span
                        className="gauge__mark"
                        style={{ left: `${gauged[i] ? tempToPercent(card.temp) : 2}%` }}
                      />
                    </div>
                  </div>
                  <div className="result__keywords">
                    {card.keywords.map((k) => (
                      <span className="kw" key={k}>
                        #{k}
                      </span>
                    ))}
                  </div>
                  <p className="result__story">{card.story}</p>
                  <div className="result__block">
                    <h4>감정의 상태</h4>
                    <p>{card.emotion}</p>
                  </div>
                  <div className="result__block">
                    <h4>지금 마음의 결</h4>
                    <p>{card.action}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="reading__actions">
              <button type="button" className="btn btn--primary" onClick={reset}>
                다시 보기
              </button>
            </div>
            <p className="reading__foot">연애의 온도 · 그림과 이야기로 읽는 마음</p>
          </section>
        )}
      </div>
    </div>
  )
}
