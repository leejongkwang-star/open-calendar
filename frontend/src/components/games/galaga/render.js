import {
  BOMB_TIME,
  BULLET_H,
  BULLET_W,
  ENEMY_DEFS,
  HEIGHT,
  HIT_RADIUS,
  MAX_STAGES,
  PALETTE,
  PLAYER_H,
  PLAYER_W,
  WIDTH,
} from './constants'

const PLAYER_PX = [
  '..121..',
  '.12221.',
  '1222221',
  '13.2.31',
  '1.222.1',
  '..1.1..',
]

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function drawSprite(ctx, map, ox, oy, colors, scale = 2) {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const ch = map[row][col]
      if (ch === '.') continue
      const color = colors[Number(ch) - 1] || colors[0]
      px(ctx, ox + col * scale, oy + row * scale, scale, scale, color)
    }
  }
}

const MIDBOSS_PX = [
  '......44444444......',
  '....441111111144....',
  '...41112222211114...',
  '..4112223333222114..',
  '.4112222.33.2222114.',
  '.1122211.33.1122211.',
  '..1122112222112211..',
  '...1111.2222.1111...',
  '...4.22......22.4...',
  '....222......222....',
  '.....2...44...2.....',
]

const BOSS_PX = [
  '........44444444........',
  '......441111111144......',
  '....4411222222221144....',
  '...411222333333222114...',
  '..41122223333332222114..',
  '.4112222..3333..2222114.',
  '.1122211..3333..1122211.',
  '..112211.222222.112211..',
  '...1111.22.11.22.1111...',
  '...4.222......222.4.....',
  '....2222.4..4.2222......',
  '.....22..4444..22.......',
  '......2...44...2........',
]

function drawBossSprite(ctx, enemy) {
  const map = enemy.type === 'boss' ? BOSS_PX : MIDBOSS_PX
  const colors = enemy.flash > 0
    ? ['#ffffff', '#fff6c2', '#ffffff', '#ffe566']
    : ENEMY_DEFS[enemy.type].colors
  const scale = 2
  const sw = map[0].length * scale
  const sh = map.length * scale
  const ox = Math.round(enemy.x + (enemy.w - sw) / 2)
  const oy = Math.round(enemy.y + (enemy.h - sh) / 2)
  const pulse = Math.floor(enemy.t * 8) % 2
  const hull = enemy.flash > 0 ? '#ffffff' : colors[3]
  px(ctx, Math.round(enemy.x) + 8, Math.round(enemy.y) + 8, enemy.w - 16, enemy.h - 14, hull)

  if (enemy.type === 'boss') {
    px(ctx, ox - 6, oy + 10 + pulse, 6, 4, colors[1])
    px(ctx, ox + sw, oy + 10 + pulse, 6, 4, colors[1])
    px(ctx, ox - 4, oy + 16, 4, 8, colors[0])
    px(ctx, ox + sw, oy + 16, 4, 8, colors[0])
  } else {
    px(ctx, ox - 4, oy + 8 + pulse, 4, 4, colors[1])
    px(ctx, ox + sw, oy + 8 + pulse, 4, 4, colors[1])
  }

  drawSprite(ctx, map, ox, oy, colors, scale)

  const coreX = ox + sw / 2 - 3
  const coreY = oy + 10
  px(ctx, coreX, coreY, 6, 6, pulse ? '#ffffff' : colors[2])
}

function drawEnemyShip(ctx, enemy) {
  if (enemy.type === 'boss' || enemy.type === 'midboss') {
    drawBossSprite(ctx, enemy)
    return
  }

  const def = ENEMY_DEFS[enemy.type]
  const x = Math.round(enemy.x)
  const y = Math.round(enemy.y)
  const w = enemy.w
  const [c1, c2] = def.colors

  px(ctx, x + 2, y, w - 4, enemy.h - 2, enemy.flash > 0 ? '#ffffff' : c1)
  px(ctx, x, y + 4, w, 4, enemy.flash > 0 ? '#fff6c2' : c2)
  px(ctx, x + w / 2 - 2, y + 2, 4, 4, '#ffffff')
  if (enemy.type === 'spinner') {
    const t = Math.floor(enemy.t * 8) % 2
    px(ctx, x - 2, y + 4 + t, 4, 4, c2)
    px(ctx, x + w - 2, y + 4 + (1 - t), 4, 4, c2)
  }
}

export function renderGame(ctx, state, { focus = false } = {}) {
  ctx.imageSmoothingEnabled = false
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 5 : 0
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * 5 : 0
  ctx.save()
  ctx.translate(shakeX, shakeY)

  ctx.fillStyle = PALETTE.bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  for (let i = 0; i < 8; i++) {
    px(ctx, (i * 37) % WIDTH, (i * 61) % HEIGHT, WIDTH / 8, 2, PALETTE.bg2)
  }

  state.stars.forEach((st) => {
    const color = st.s === 1 ? PALETTE.star3 : st.s === 2 ? PALETTE.star2 : PALETTE.star1
    px(ctx, st.x, st.y, st.s, st.s, color)
  })

  if (state.bombTimer > 0) {
    const t = Math.min(1, state.bombTimer / BOMB_TIME)
    ctx.fillStyle = `rgba(255, 230, 80, ${0.2 + t * 0.55})`
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    const radius = (1 - t) * Math.hypot(WIDTH, HEIGHT)
    ctx.strokeStyle = `rgba(255,255,255,${t})`
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(WIDTH / 2, HEIGHT / 2, Math.max(8, radius), 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = `rgba(255, 160, 40, ${t * 0.8})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(WIDTH / 2, HEIGHT / 2, Math.max(4, radius * 0.55), 0, Math.PI * 2)
    ctx.stroke()
  }

  state.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life / 0.4)
    px(ctx, p.x, p.y, 3, 3, p.color)
    ctx.globalAlpha = 1
  })

  state.enemies.forEach((e) => drawEnemyShip(ctx, e))

  state.enemyBullets.forEach((b) => {
    const s = Math.max(3, Math.round(b.r * 2))
    px(ctx, b.x - s / 2, b.y - s / 2, s, s, b.color)
    px(ctx, b.x - 1, b.y - 1, 2, 2, '#ffffff')
  })

  state.playerBullets.forEach((b) => {
    px(ctx, b.x - BULLET_W / 2, b.y - BULLET_H / 2, BULLET_W, BULLET_H, PALETTE.pBullet)
    px(ctx, b.x - 1, b.y - BULLET_H / 2 - 2, 2, 3, '#ffffff')
  })

  const blink = state.invincible > 0 && Math.floor(state.invincible * 12) % 2 === 0
  if (state.respawnTimer <= 0 && !blink) {
    drawSprite(ctx, PLAYER_PX, state.player.x, state.player.y, PALETTE.player, 2)
  }
  if (state.respawnTimer <= 0 && (focus || state.invincible > 0)) {
    const cx = state.player.x + PLAYER_W / 2
    const cy = state.player.y + PLAYER_H / 2
    px(ctx, cx - HIT_RADIUS, cy - HIT_RADIUS, HIT_RADIUS * 2, HIT_RADIUS * 2, PALETTE.hitbox)
  }

  ctx.restore()

  ctx.fillStyle = 'rgba(0,0,0,0.72)'
  ctx.fillRect(0, 0, WIDTH, 18)
  ctx.fillRect(0, HEIGHT - 16, WIDTH, 16)

  ctx.fillStyle = '#ffe566'
  ctx.font = 'bold 9px monospace'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(Math.floor(state.score).toString().padStart(8, '0'), 6, 5)
  ctx.fillStyle = '#9aa4c2'
  ctx.font = '8px monospace'
  ctx.fillText(`GRAZE ${state.graze}`, 86, 6)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`STAGE ${state.stage}/${MAX_STAGES}`, WIDTH - 6, 5)
  ctx.textAlign = 'left'

  const boss = state.enemies.find((e) => e.type === 'boss' || e.type === 'midboss')
  if (boss) {
    const ratio = Math.max(0, boss.hp / boss.maxHp)
    const label = boss.type === 'boss' ? 'FINAL CORE' : 'MID BOSS'
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(8, 20, WIDTH - 16, 12)
    ctx.fillStyle = '#2a2038'
    ctx.fillRect(10, 26, WIDTH - 20, 4)
    ctx.fillStyle = ratio > 0.33 ? '#ff4d6d' : '#ffe566'
    ctx.fillRect(10, 26, Math.round((WIDTH - 20) * ratio), 4)
    ctx.fillStyle = '#ffe566'
    ctx.font = '7px monospace'
    ctx.fillText(label, 10, 20)
  }

  ctx.fillStyle = '#9aa4c2'
  ctx.font = '8px monospace'
  ctx.fillText('L', 6, HEIGHT - 12)
  let lx = 16
  for (let i = 0; i < state.lives; i++) {
    px(ctx, lx, HEIGHT - 11, 7, 7, PALETTE.player[0])
    px(ctx, lx + 2, HEIGHT - 9, 3, 3, '#ffffff')
    lx += 10
  }
  ctx.fillStyle = '#9aa4c2'
  ctx.textAlign = 'right'
  ctx.fillText('B', WIDTH - 6 - state.bombs * 10, HEIGHT - 12)
  ctx.textAlign = 'left'
  let bx = WIDTH - 13
  for (let i = 0; i < state.bombs; i++) {
    px(ctx, bx, HEIGHT - 11, 7, 7, '#ffe566')
    bx -= 10
  }

  if (state.combo > 1) {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffe566'
    ctx.font = 'bold 9px monospace'
    ctx.fillText(`x${state.combo}`, WIDTH / 2, HEIGHT - 12)
    ctx.textAlign = 'left'
  }

  if (state.banner && state.banner.time > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(20, HEIGHT / 2 - 28, WIDTH - 40, 48)
    ctx.fillStyle = '#ffe566'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(state.banner.text, WIDTH / 2, HEIGHT / 2 - 18)
    if (state.banner.sub) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '8px monospace'
      ctx.fillText(state.banner.sub, WIDTH / 2, HEIGHT / 2 + 2)
    }
    ctx.textAlign = 'left'
  }
}
