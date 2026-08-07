import {
  WIDTH,
  HEIGHT,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_Y,
  PLAYER_SPEED,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  FIRE_COOLDOWN,
  MAX_PLAYER_BULLETS,
  ENEMY_WIDTH,
  ENEMY_HEIGHT,
  FORMATION_SPEED,
  FORMATION_DROP,
  DIVE_SPEED,
  LIVES,
  INVINCIBLE_TIME,
  COMBO_WINDOW,
  MAX_WAVES,
  ENEMY_TYPES,
  WAVE_TEMPLATES,
} from './constants'

let nextId = 1
const uid = () => nextId++

function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

function spawnWave(waveIndex) {
  const template = WAVE_TEMPLATES[Math.min(waveIndex, WAVE_TEMPLATES.length - 1)]
  const enemies = []
  const gapX = 36
  const gapY = 34
  const startY = 56

  template.forEach((row, rowIndex) => {
    const rowWidth = row.length * gapX
    const startX = (WIDTH - rowWidth) / 2 + gapX / 2
    row.forEach((type, colIndex) => {
      const def = ENEMY_TYPES[type]
      const x = startX + colIndex * gapX - ENEMY_WIDTH / 2
      const y = startY + rowIndex * gapY
      enemies.push({
        id: uid(),
        type,
        hp: def.hp,
        x,
        y,
        homeX: x,
        homeY: y,
        w: ENEMY_WIDTH,
        h: ENEMY_HEIGHT,
        state: 'formation',
        diveTimer: 1.5 + Math.random() * 2.5,
        shootTimer: 1 + Math.random() * 2,
        divePhase: 0,
      })
    })
  })

  return enemies
}

export function createInitialState() {
  nextId = 1
  return {
    status: 'playing', // playing | waveClear | cleared | gameOver
    wave: 1,
    score: 0,
    lives: LIVES,
    combo: 0,
    comboTimer: 0,
    invincible: 0,
    waveClearTimer: 0,
    formationDir: 1,
    formationOffset: 0,
    player: {
      x: WIDTH / 2 - PLAYER_WIDTH / 2,
      y: PLAYER_Y,
      w: PLAYER_WIDTH,
      h: PLAYER_HEIGHT,
      fireCooldown: 0,
    },
    bullets: [],
    enemies: spawnWave(0),
    particles: [],
  }
}

function tryFirePlayer(state) {
  const playerBullets = state.bullets.filter((b) => b.from === 'player')
  if (state.player.fireCooldown > 0 || playerBullets.length >= MAX_PLAYER_BULLETS) return

  state.bullets.push({
    id: uid(),
    x: state.player.x + state.player.w / 2 - BULLET_WIDTH / 2,
    y: state.player.y - BULLET_HEIGHT,
    w: BULLET_WIDTH,
    h: BULLET_HEIGHT,
    vy: -PLAYER_BULLET_SPEED,
    from: 'player',
  })
  state.player.fireCooldown = FIRE_COOLDOWN
}

function hitPlayer(state) {
  if (state.invincible > 0) return
  state.lives -= 1
  state.invincible = INVINCIBLE_TIME
  state.combo = 0
  if (state.lives <= 0) {
    state.status = 'gameOver'
  }
}

function addScore(state, points) {
  state.combo += 1
  state.comboTimer = COMBO_WINDOW
  const comboBonus = Math.max(0, state.combo - 1) * 50
  state.score += points + comboBonus
}

function destroyEnemy(state, enemy) {
  const def = ENEMY_TYPES[enemy.type]
  addScore(state, def.score)
  state.particles.push({
    id: uid(),
    x: enemy.x + enemy.w / 2,
    y: enemy.y + enemy.h / 2,
    life: 0.35,
    color: def.color,
  })
}

function startDive(enemy, playerX) {
  enemy.state = 'diving'
  enemy.divePhase = 0
  enemy.diveTargetX = playerX
}

/**
 * @param {ReturnType<typeof createInitialState>} state
 * @param {number} dt
 * @param {{ left?: boolean, right?: boolean, fire?: boolean, dragX?: number | null }} input
 */
export function updateGame(state, dt, input) {
  if (state.status === 'gameOver' || state.status === 'cleared') return state

  if (state.status === 'waveClear') {
    state.waveClearTimer -= dt
    if (state.waveClearTimer <= 0) {
      if (state.wave >= MAX_WAVES) {
        state.score += state.lives * 1000
        state.status = 'cleared'
      } else {
        state.wave += 1
        state.enemies = spawnWave(state.wave - 1)
        state.bullets = state.bullets.filter((b) => b.from === 'player')
        state.status = 'playing'
        state.formationDir = 1
        state.formationOffset = 0
      }
    }
    return state
  }

  // 이동
  if (typeof input.dragX === 'number') {
    state.player.x = Math.max(0, Math.min(WIDTH - PLAYER_WIDTH, input.dragX - PLAYER_WIDTH / 2))
  } else {
    let dx = 0
    if (input.left) dx -= 1
    if (input.right) dx += 1
    state.player.x += dx * PLAYER_SPEED * dt
    state.player.x = Math.max(0, Math.min(WIDTH - PLAYER_WIDTH, state.player.x))
  }

  // 발사 (자동연사 포함)
  state.player.fireCooldown = Math.max(0, state.player.fireCooldown - dt)
  if (input.fire) tryFirePlayer(state)

  if (state.invincible > 0) state.invincible = Math.max(0, state.invincible - dt)
  if (state.comboTimer > 0) {
    state.comboTimer -= dt
    if (state.comboTimer <= 0) state.combo = 0
  }

  // 탄 이동
  state.bullets = state.bullets.filter((b) => {
    b.y += b.vy * dt
    return b.y + b.h > 0 && b.y < HEIGHT
  })

  // 편대 이동
  const formationEnemies = state.enemies.filter((e) => e.state === 'formation')
  if (formationEnemies.length > 0) {
    const speed = FORMATION_SPEED * (1 + (state.wave - 1) * 0.12)
    let nextOffset = state.formationOffset + state.formationDir * speed * dt
    const minX = Math.min(...formationEnemies.map((e) => e.homeX + nextOffset))
    const maxX = Math.max(...formationEnemies.map((e) => e.homeX + nextOffset + e.w))

    if (minX < 8 || maxX > WIDTH - 8) {
      state.formationDir *= -1
      nextOffset = state.formationOffset + state.formationDir * speed * dt
      formationEnemies.forEach((e) => {
        e.homeY += FORMATION_DROP
      })
    }
    state.formationOffset = nextOffset
    formationEnemies.forEach((e) => {
      e.x = e.homeX + state.formationOffset
      e.y = e.homeY
    })
  }

  const playerCenterX = state.player.x + state.player.w / 2
  const allowEnemyBullets = state.wave >= 3

  state.enemies.forEach((enemy) => {
    const def = ENEMY_TYPES[enemy.type]

    if (enemy.state === 'formation') {
      if (def.canDive) {
        enemy.diveTimer -= dt
        if (enemy.diveTimer <= 0 && Math.random() < 0.4) {
          startDive(enemy, playerCenterX)
        } else if (enemy.diveTimer <= 0) {
          enemy.diveTimer = 1 + Math.random() * 2
        }
      }
      if (def.canShoot && allowEnemyBullets) {
        enemy.shootTimer -= dt
        if (enemy.shootTimer <= 0) {
          state.bullets.push({
            id: uid(),
            x: enemy.x + enemy.w / 2 - BULLET_WIDTH / 2,
            y: enemy.y + enemy.h,
            w: BULLET_WIDTH,
            h: BULLET_HEIGHT,
            vy: ENEMY_BULLET_SPEED,
            from: 'enemy',
          })
          enemy.shootTimer = 1.8 + Math.random() * 1.5
        }
      }
    } else if (enemy.state === 'diving') {
      enemy.divePhase += dt
      const t = enemy.divePhase
      enemy.x += (enemy.diveTargetX - (enemy.x + enemy.w / 2)) * Math.min(1, dt * 2)
      enemy.y += DIVE_SPEED * dt
      // 살짝 좌우 흔들림
      enemy.x += Math.sin(t * 8) * 40 * dt

      if (enemy.y > HEIGHT + 20) {
        enemy.state = 'formation'
        enemy.x = enemy.homeX + state.formationOffset
        enemy.y = enemy.homeY
        enemy.diveTimer = 2 + Math.random() * 3
      }
    }
  })

  // 플레이어 탄 → 적
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i]
    if (bullet.from !== 'player') continue
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const enemy = state.enemies[j]
      if (!aabb(bullet, enemy)) continue
      state.bullets.splice(i, 1)
      enemy.hp -= 1
      if (enemy.hp <= 0) {
        destroyEnemy(state, enemy)
        state.enemies.splice(j, 1)
      }
      break
    }
  }

  // 적 탄 → 플레이어
  const playerBox = state.player
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const bullet = state.bullets[i]
    if (bullet.from !== 'enemy') continue
    if (aabb(bullet, playerBox)) {
      state.bullets.splice(i, 1)
      hitPlayer(state)
      if (state.status === 'gameOver') return state
    }
  }

  // 적 본체 → 플레이어
  for (const enemy of state.enemies) {
    if (aabb(enemy, playerBox)) {
      hitPlayer(state)
      if (state.status === 'gameOver') return state
    }
  }

  // 파티클
  state.particles = state.particles.filter((p) => {
    p.life -= dt
    return p.life > 0
  })

  // 웨이브 클리어
  if (state.enemies.length === 0) {
    state.score += state.wave * 500
    state.status = 'waveClear'
    state.waveClearTimer = 1.2
  }

  return state
}

export function renderGame(ctx, state) {
  // 배경
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  gradient.addColorStop(0, '#0b1224')
  gradient.addColorStop(1, '#111827')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // 별
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97) % WIDTH
    const sy = (i * 53 + (state.wave * 10)) % HEIGHT
    ctx.fillRect(sx, sy, 2, 2)
  }

  // 적
  state.enemies.forEach((enemy) => {
    const def = ENEMY_TYPES[enemy.type]
    ctx.fillStyle = def.color
    ctx.beginPath()
    ctx.moveTo(enemy.x + enemy.w / 2, enemy.y)
    ctx.lineTo(enemy.x + enemy.w, enemy.y + enemy.h * 0.65)
    ctx.lineTo(enemy.x + enemy.w * 0.75, enemy.y + enemy.h)
    ctx.lineTo(enemy.x + enemy.w * 0.25, enemy.y + enemy.h)
    ctx.lineTo(enemy.x, enemy.y + enemy.h * 0.65)
    ctx.closePath()
    ctx.fill()
    if (enemy.hp > 1) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  })

  // 탄
  state.bullets.forEach((b) => {
    ctx.fillStyle = b.from === 'player' ? '#fde047' : '#fb7185'
    ctx.fillRect(b.x, b.y, b.w, b.h)
  })

  // 플레이어
  if (state.invincible <= 0 || Math.floor(state.invincible * 10) % 2 === 0) {
    const p = state.player
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath()
    ctx.moveTo(p.x + p.w / 2, p.y)
    ctx.lineTo(p.x + p.w, p.y + p.h)
    ctx.lineTo(p.x, p.y + p.h)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#e0f2fe'
    ctx.fillRect(p.x + p.w / 2 - 2, p.y + 6, 4, 8)
  }

  // 파티클
  state.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life / 0.35)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, 8 * (p.life / 0.35), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  })
}
