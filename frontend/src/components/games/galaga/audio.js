let ctx = null
let unlocked = false
let shootGate = 0
let hitGate = 0
let explodeGate = 0

function getCtx() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

export function unlockAudio() {
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume()
  unlocked = true
}

function beep(freq, dur, type = 'square', gain = 0.06, slideTo = null) {
  const ac = getCtx()
  if (!ac || !unlocked) return
  const t0 = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(Math.max(40, freq), t0)
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur)
  }
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noiseBurst(dur, gain, freq = 1400) {
  const ac = getCtx()
  if (!ac || !unlocked) return
  const n = Math.floor(ac.sampleRate * Math.min(dur + 0.05, 0.5))
  const buffer = ac.createBuffer(1, n, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  const g = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(freq, ac.currentTime)
  filter.frequency.exponentialRampToValueAtTime(180, ac.currentTime + dur)
  filter.Q.value = 0.8
  src.buffer = buffer
  src.connect(filter)
  filter.connect(g)
  g.connect(ac.destination)
  const t0 = ac.currentTime
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

function shootSfx() {
  // 8비트 아케이드 레이저: 높은 펄스가 짧게 내려감
  beep(1680, 0.07, 'square', 0.055, 420)
  beep(840, 0.045, 'square', 0.03, 220)
}

function enemyExplodeSfx() {
  noiseBurst(0.2, 0.12, 1200)
  beep(220, 0.18, 'sawtooth', 0.06, 70)
}

function playerExplodeSfx() {
  noiseBurst(0.38, 0.16, 900)
  beep(280, 0.28, 'square', 0.08, 60)
  beep(140, 0.32, 'sawtooth', 0.07, 50)
}

export function playSfx(type) {
  try {
    const now = performance.now()
    switch (type) {
      case 'shoot':
        if (now - shootGate < 55) return
        shootGate = now
        shootSfx()
        break
      case 'hit':
        if (now - hitGate < 40) return
        hitGate = now
        beep(980, 0.025, 'square', 0.035, 520)
        break
      case 'explode':
        if (now - explodeGate < 50) return
        explodeGate = now
        enemyExplodeSfx()
        break
      case 'playerExplode':
      case 'hurt':
        playerExplodeSfx()
        break
      case 'bomb':
        noiseBurst(0.32, 0.14, 700)
        beep(180, 0.3, 'sawtooth', 0.08, 55)
        break
      case 'stage':
        beep(523, 0.1, 'square', 0.05)
        setTimeout(() => beep(659, 0.1, 'square', 0.05), 90)
        setTimeout(() => beep(784, 0.16, 'square', 0.06), 180)
        break
      case 'clear':
        beep(523, 0.12, 'square', 0.05)
        setTimeout(() => beep(784, 0.22, 'square', 0.06), 120)
        break
      case 'over':
        beep(330, 0.18, 'square', 0.06, 160)
        setTimeout(() => beep(196, 0.35, 'square', 0.06, 80), 160)
        break
      default:
        break
    }
  } catch {
    // 오디오 실패가 게임 루프를 멈추지 않게 함
  }
}

export function drainEvents(state) {
  if (!state?.events?.length) return
  for (const ev of state.events) playSfx(ev)
  state.events.length = 0
}
