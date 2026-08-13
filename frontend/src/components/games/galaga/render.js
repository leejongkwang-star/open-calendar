import {
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

function drawEnemyShip(ctx, enemy) {
  const def = ENEMY_DEFS[enemy.type]
  const x = Math.round(enemy.x)
  const y = Math.round(enemy.y)
  const w = enemy.w
  const h = enemy.h
  const [c1, c2] = def.colors

  if (enemy.type === 'boss' || enemy.type === 'midboss') {
    px(ctx, x + 4, y + 6, w - 8, h - 10, c1)
    px(ctx, x, y + 10, w, 6, c2)
    px(ctx, x + w / 2 - 4, y, 8, 8, '#ffffff')
    px(ctx, x + 2, y + h - 8, 8, 8, c1)
    px(ctx, x + w - 10, y + h - 8, 8, 8, c1)
    const ratio = Math.max(0, enemy.hp / enemy.maxHp)
    px(ctx, x, y - 6, w, 3, '#2a2038')
    px(ctx, x, y - 6, Math.round(w * ratio), 3, ratio > 0.33 ? '#7cff6b' : '#ff4d6d')
    return
  }

  px(ctx, x + 2, y, w - 4, h - 2, c1)
  px(ctx, x, y + 4, w, 4, c2)
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
    ctx.fillStyle = `rgba(255, 243, 107, ${state.bombTimer * 0.35})`
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
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
    px(ctx, b.x - 1, b.y - 4, 3, 8, PALETTE.pBullet)
    px(ctx, b.x, b.y - 5, 1, 3, '#ffffff')
  })

  const blink = state.invincible > 0 && Math.floor(state.invincible * 12) % 2 === 0
  if (!blink) {
    drawSprite(ctx, PLAYER_PX, state.player.x, state.player.y, PALETTE.player, 2)
  }
  if (focus || state.invincible > 0) {
    const cx = state.player.x + PLAYER_W / 2
    const cy = state.player.y + PLAYER_H / 2
    px(ctx, cx - HIT_RADIUS, cy - HIT_RADIUS, HIT_RADIUS * 2, HIT_RADIUS * 2, PALETTE.hitbox)
  }

  ctx.restore()

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, WIDTH, 16)
  ctx.fillStyle = PALETTE.hud
  ctx.font = '8px monospace'
  ctx.textBaseline = 'top'
  ctx.fillText(`SC ${Math.floor(state.score).toString().padStart(8, '0')}`, 4, 4)
  ctx.fillText(`${state.stage}/${MAX_STAGES}`, WIDTH - 28, 4)

  let lx = 4
  for (let i = 0; i < state.lives; i++) {
    px(ctx, lx, HEIGHT - 10, 6, 6, PALETTE.player[0])
    lx += 8
  }
  let bx = WIDTH - 10
  for (let i = 0; i < state.bombs; i++) {
    px(ctx, bx, HEIGHT - 10, 6, 6, '#ffe566')
    bx -= 8
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
