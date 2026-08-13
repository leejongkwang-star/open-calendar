import { HEIGHT, MAX_ENEMY_BULLETS, WIDTH } from './constants'

let nextId = 1
export const resetIds = () => { nextId = 1 }
export const uid = () => nextId++

const COLORS = ['#ff4d6d', '#7af7ff', '#ffe566', '#ff9ff3', '#ffffff', '#7cff6b']

export function bulletColor(stage, variant = 0) {
  return COLORS[(stage + variant) % COLORS.length]
}

export function canSpawn(state, extra = 1) {
  return state.enemyBullets.length + extra <= MAX_ENEMY_BULLETS
}

export function pushBullet(state, x, y, angle, speed, r, color) {
  if (!canSpawn(state)) return
  state.enemyBullets.push({
    id: uid(),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r,
    color,
    grazed: false,
  })
}

export function aimed(state, x, y, tx, ty, speed, color, r = 2.4) {
  const angle = Math.atan2(ty - y, tx - x)
  pushBullet(state, x, y, angle, speed, r, color)
}

export function nWay(state, x, y, count, speed, startAngle, color, r = 2.3) {
  if (!canSpawn(state, count)) return
  for (let i = 0; i < count; i++) {
    const a = startAngle + (i * Math.PI * 2) / count
    pushBullet(state, x, y, a, speed, r, color)
  }
}

export function fan(state, x, y, centerAngle, spread, count, speed, color, r = 2.3) {
  if (count <= 1) {
    pushBullet(state, x, y, centerAngle, speed, r, color)
    return
  }
  const start = centerAngle - spread / 2
  const step = spread / (count - 1)
  for (let i = 0; i < count; i++) {
    pushBullet(state, x, y, start + step * i, speed, r, color)
  }
}

export function ring(state, x, y, count, speed, rot, color, r = 2.2) {
  nWay(state, x, y, count, speed, rot, color, r)
}

export function rain(state, speed, color, columns) {
  const gap = WIDTH / (columns + 1)
  const offset = (Math.random() * gap) - gap / 2
  for (let i = 1; i <= columns; i++) {
    pushBullet(state, gap * i + offset, -6, Math.PI / 2, speed, 2.1, color)
  }
}

export function pruneBullets(bullets) {
  const m = 18
  return bullets.filter((b) => b.x > -m && b.x < WIDTH + m && b.y > -m && b.y < HEIGHT + m)
}
