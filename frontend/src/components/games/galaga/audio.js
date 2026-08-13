let ctx = null
let unlocked = false
let shootGate = 0
let hitGate = 0

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

function beep(freq, dur, type = 'square', gain = 0.06, slide = 0) {
  const ac = getCtx()
  if (!ac || !unlocked) return
  const t0 = ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur)
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur, gain = 0.08) {
  const ac = getCtx()
  if (!ac || !unlocked) return
  const n = 2048
  const buffer = ac.createBuffer(1, n, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  const g = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1800
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

export function playSfx(type) {
  const now = performance.now()
  switch (type) {
    case 'shoot':
      if (now - shootGate < 70) return
      shootGate = now
      beep(880, 0.045, 'square', 0.035)
      break
    case 'hit':
      if (now - hitGate < 40) return
      hitGate = now
      beep(420, 0.03, 'square', 0.04)
      break
    case 'explode':
      noise(0.18, 0.1)
      beep(180, 0.16, 'sawtooth', 0.05, -120)
      break
    case 'bomb':
      beep(220, 0.35, 'sawtooth', 0.08, -160)
      noise(0.28, 0.09)
      break
    case 'hurt':
      beep(160, 0.22, 'square', 0.07, -80)
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
      beep(330, 0.18, 'square', 0.06, -80)
      setTimeout(() => beep(196, 0.35, 'square', 0.06, -60), 160)
      break
    default:
      break
  }
}

export function drainEvents(state) {
  if (!state?.events?.length) return
  for (const ev of state.events) playSfx(ev)
  state.events.length = 0
}
