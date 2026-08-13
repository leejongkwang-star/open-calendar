import {
  BOMB_TIME,
  BOMBS,
  BULLET_H,
  BULLET_W,
  ENEMY_DEFS,
  ENEMY_HURT_PAD,
  EXTRA_LIFE_SCORES,
  FIRE_COOLDOWN,
  FOCUS_SPEED,
  GRAZE_RADIUS,
  HEIGHT,
  HIT_RADIUS,
  INVINCIBLE_TIME,
  LIVES,
  MAX_PLAYER_BULLETS,
  MAX_STAGES,
  PLAYER_BULLET_SPEED,
  PLAYER_H,
  PLAYER_SPEED,
  PLAYER_W,
  STAGES,
  WIDTH,
  difficulty,
} from './constants'
import {
  aimed,
  bulletColor,
  fan,
  nWay,
  pruneBullets,
  rain,
  resetIds,
  ring,
  uid,
} from './patterns'

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

function hpFor(type, stage) {
  return Math.round(ENEMY_DEFS[type].hp * difficulty(stage).hp)
}

function spawnEnemy(state, type, x, y, path = 'sine') {
  const def = ENEMY_DEFS[type]
  state.enemies.push({
    id: uid(),
    type,
    hp: hpFor(type, state.stage),
    maxHp: hpFor(type, state.stage),
    x,
    y,
    w: def.w,
    h: def.h,
    path,
    t: 0,
    fireCd: 0.4 + Math.random() * 0.6,
    angle: Math.PI / 2,
    spin: (Math.random() < 0.5 ? 1 : -1) * (1.6 + state.stage * 0.18),
    phase: 0,
    flash: 0,
    originX: x,
    originY: y,
  })
}

function spawnBoss(state, type) {
  spawnEnemy(state, type, WIDTH / 2 - ENEMY_DEFS[type].w / 2, -40, 'boss')
}

function nextExtraLife(state) {
  return EXTRA_LIFE_SCORES.find((s) => s > (state.lastExtraAt || 0)) || null
}

function emit(state, type) {
  if (!state.events) state.events = []
  state.events.push(type)
}

function addScore(state, points) {
  state.score += points
  const extra = nextExtraLife(state)
  if (extra && state.score >= extra) {
    state.lives += 1
    state.lastExtraAt = extra
    state.banner = { text: '1UP', sub: '', time: 1.2 }
    emit(state, 'clear')
  }
}

function explode(state, x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    state.particles.push({
      id: uid(),
      x,
      y,
      vx: Math.cos(a) * (40 + Math.random() * 70),
      vy: Math.sin(a) * (40 + Math.random() * 70),
      life: 0.28 + Math.random() * 0.2,
      color,
    })
  }
}

function startStage(state, stage) {
  const meta = STAGES[stage - 1]
  state.stage = stage
  state.stageTime = 0
  state.spawnAcc = 0
  state.waveAcc = 0
  state.rainAcc = 0
  state.phase = 'intro'
  state.introTimer = 2.4
  state.clearTimer = 0
  state.bossSpawned = false
  state.enemies = []
  state.enemyBullets = []
  state.banner = { text: meta.name, sub: meta.title, time: 2.4 }
  emit(state, 'stage')
}

export function createInitialState() {
  resetIds()
  const state = {
    status: 'playing',
    phase: 'intro',
    stage: 1,
    stageTime: 0,
    introTimer: 2.4,
    clearTimer: 0,
    spawnAcc: 0,
    waveAcc: 0,
    rainAcc: 0,
    bossSpawned: false,
    score: 0,
    lastExtraAt: 0,
    lives: LIVES,
    bombs: BOMBS,
    combo: 0,
    comboTimer: 0,
    graze: 0,
    invincible: 2.0,
    bombTimer: 0,
    shake: 0,
    banner: { text: STAGES[0].name, sub: STAGES[0].title, time: 2.4 },
    player: {
      x: WIDTH / 2 - PLAYER_W / 2,
      y: HEIGHT - 56,
      fireCd: 0,
    },
    playerBullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    events: ['stage'],
    stars: Array.from({ length: 48 }, (_, i) => ({
      x: (i * 53) % WIDTH,
      y: (i * 89) % HEIGHT,
      s: 1 + (i % 3),
      v: 18 + (i % 5) * 14,
    })),
  }
  return state
}

function tryFirePlayer(state) {
  if (state.player.fireCd > 0 || state.playerBullets.length >= MAX_PLAYER_BULLETS) return
  const cx = state.player.x + PLAYER_W / 2
  const y = state.player.y
  const shots = state.stage >= 5 ? [-5, 0, 5] : [-4, 4]
  shots.forEach((ox) => {
    state.playerBullets.push({
      id: uid(),
      x: cx + ox,
      y,
      vy: -PLAYER_BULLET_SPEED,
      r: 2.2,
    })
  })
  state.player.fireCd = FIRE_COOLDOWN
  emit(state, 'shoot')
}

function useBomb(state) {
  if (state.bombs <= 0 || state.bombTimer > 0 || state.status !== 'playing') return
  if (state.phase === 'intro' || state.phase === 'clear') return
  state.bombs -= 1
  state.bombTimer = BOMB_TIME
  state.invincible = Math.max(state.invincible, 1.1)
  state.enemyBullets = []
  explode(state, state.player.x + PLAYER_W / 2, state.player.y + PLAYER_H / 2, '#fff36b', 18)
  addScore(state, 500)
  emit(state, 'bomb')
}

function hitPlayer(state) {
  if (state.invincible > 0 || state.bombTimer > 0) return
  state.lives -= 1
  state.invincible = INVINCIBLE_TIME
  state.combo = 0
  state.shake = 0.28
  state.enemyBullets = []
  explode(state, state.player.x + PLAYER_W / 2, state.player.y + PLAYER_H / 2, '#ff4d6d', 14)
  emit(state, 'hurt')
  if (state.lives <= 0) {
    state.status = 'gameOver'
    emit(state, 'over')
  }
}

function destroyEnemy(state, enemy) {
  const def = ENEMY_DEFS[enemy.type]
  const comboBonus = Math.max(0, state.combo) * 20
  addScore(state, def.score + comboBonus)
  state.combo += 1
  state.comboTimer = 2.2
  explode(state, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, def.colors[0], enemy.type === 'boss' ? 22 : 10)
  emit(state, 'explode')
}

function playerCenter(state) {
  return {
    x: state.player.x + PLAYER_W / 2,
    y: state.player.y + PLAYER_H / 2,
  }
}

function moveEnemy(enemy, dt, stage) {
  enemy.t += dt
  const t = enemy.t
  if (enemy.path === 'sine') {
    enemy.y += (42 + stage * 4) * dt
    enemy.x = enemy.originX + Math.sin(t * 2.2) * 28
  } else if (enemy.path === 'dive') {
    enemy.y += (90 + stage * 8) * dt
    enemy.x = enemy.originX + Math.sin(t * 5) * 18
  } else if (enemy.path === 'hover') {
    if (enemy.y < 48 + (enemy.originY % 40)) enemy.y += 70 * dt
    else enemy.x = enemy.originX + Math.sin(t * 1.4) * (36 + stage * 2)
  } else if (enemy.path === 'side') {
    enemy.x += (enemy.originX < WIDTH / 2 ? 1 : -1) * (50 + stage * 4) * dt
    enemy.y = enemy.originY + 40 + Math.sin(t * 2) * 22
  } else if (enemy.path === 'boss') {
    if (enemy.y < 46) enemy.y += 50 * dt
    else {
      enemy.x = WIDTH / 2 - enemy.w / 2 + Math.sin(t * 0.7) * 48
      enemy.y = 46 + Math.sin(t * 1.1) * 10
    }
  }
}

function fireEnemy(state, enemy, dt) {
  const d = difficulty(state.stage)
  enemy.fireCd -= dt
  enemy.angle += enemy.spin * dt
  if (enemy.fireCd > 0) return

  const cx = enemy.x + enemy.w / 2
  const cy = enemy.y + enemy.h / 2
  const p = playerCenter(state)
  const speed = 70 * d.speed
  const color = bulletColor(state.stage, enemy.id)
  const stage = state.stage

  if (enemy.type === 'drone') {
    aimed(state, cx, cy, p.x, p.y, speed * 1.05, color)
    if (stage >= 4) fan(state, cx, cy, Math.atan2(p.y - cy, p.x - cx), 0.4, 3, speed, color)
    enemy.fireCd = 1.15 * d.fire
  } else if (enemy.type === 'fan') {
    const down = Math.PI / 2
    fan(state, cx, cy, down, 1.05 + stage * 0.05, 5 + Math.min(4, Math.floor(stage / 2)), speed * 0.95, color)
    enemy.fireCd = 1.05 * d.fire
  } else if (enemy.type === 'spinner') {
    const streams = stage >= 6 ? 3 : stage >= 3 ? 2 : 1
    for (let i = 0; i < streams; i++) {
      const a = enemy.angle + (i * Math.PI * 2) / streams
      nWay(state, cx, cy, 1, speed * 0.88, a, color, 2.1)
    }
    enemy.fireCd = (stage >= 6 ? 0.07 : 0.1) * d.fire
  } else if (enemy.type === 'gunner') {
    ring(state, cx, cy, 10 + stage, speed * 0.8, enemy.angle, color)
    if (stage >= 5) aimed(state, cx, cy, p.x, p.y, speed * 1.25, '#ffffff', 2.6)
    enemy.fireCd = 1.35 * d.fire
  } else if (enemy.type === 'sniper') {
    aimed(state, cx, cy, p.x, p.y, speed * 1.55, '#ffffff', 2.8)
    if (stage >= 6) fan(state, cx, cy, Math.atan2(p.y - cy, p.x - cx), 0.28, 3, speed * 1.2, color)
    enemy.fireCd = 0.72 * d.fire
  } else if (enemy.type === 'tank') {
    ring(state, cx, cy, 16, speed * 0.7, enemy.angle, color, 2.4)
    fan(state, cx, cy, Math.PI / 2, 1.4, 7, speed * 0.9, bulletColor(stage, 2))
    enemy.fireCd = 1.5 * d.fire
  } else if (enemy.type === 'midboss') {
    enemy.phase += dt
    const cycle = enemy.phase % 6
    if (cycle < 2) {
      ring(state, cx, cy, 18 + stage, speed * 0.78, enemy.angle, color)
      enemy.fireCd = 0.38 * d.fire
    } else if (cycle < 4) {
      fan(state, cx, cy, Math.atan2(p.y - cy, p.x - cx), 1.1, 9, speed * 1.05, '#ffe566')
      enemy.fireCd = 0.28 * d.fire
    } else {
      nWay(state, cx, cy, 2, speed * 0.9, enemy.angle, '#7af7ff', 2.2)
      nWay(state, cx, cy, 2, speed * 0.9, -enemy.angle, '#ff9ff3', 2.2)
      enemy.fireCd = 0.08 * d.fire
    }
  } else if (enemy.type === 'boss') {
    enemy.phase += dt
    const hpRatio = enemy.hp / enemy.maxHp
    if (hpRatio > 0.66) {
      ring(state, cx, cy, 20, speed * 0.82, enemy.angle, '#ff4d6d')
      nWay(state, cx, cy, 3, speed * 0.7, enemy.angle * 1.4, '#7af7ff', 2.1)
      enemy.fireCd = 0.12
    } else if (hpRatio > 0.33) {
      ring(state, cx, cy, 28, speed * 0.9, enemy.angle, '#ffe566', 2.3)
      aimed(state, cx, cy, p.x, p.y, speed * 1.4, '#ffffff', 3)
      fan(state, cx, cy, Math.PI / 2, 1.6, 11, speed, '#ff9ff3')
      enemy.fireCd = 0.22
    } else {
      ring(state, cx, cy, 16, speed * 1.05, enemy.angle, '#ff2d55', 2.5)
      ring(state, cx, cy, 16, speed * 0.75, -enemy.angle * 0.7, '#7af7ff', 2.1)
      nWay(state, cx, cy, 5, speed * 0.85, enemy.angle * 2, '#ffffff', 2)
      rain(state, speed * 0.55, '#ff4d6d', 5)
      enemy.fireCd = 0.16
    }
  }
}

function spawnWave(state) {
  const s = state.stage
  const t = state.stageTime
  const y = -18
  const pick = (...types) => types[Math.floor(Math.random() * types.length)]

  if (s === 1) {
    spawnEnemy(state, 'drone', 40 + (t * 37) % 180, y, 'sine')
    spawnEnemy(state, 'drone', 180 - ((t * 29) % 140), y, 'sine')
  } else if (s === 2) {
    spawnEnemy(state, 'drone', 30 + Math.random() * 190, y, 'dive')
    spawnEnemy(state, pick('fan', 'drone'), 50 + Math.random() * 160, y, 'sine')
  } else if (s === 3) {
    spawnEnemy(state, 'spinner', 48, y, 'hover')
    spawnEnemy(state, 'spinner', WIDTH - 64, y, 'hover')
    spawnEnemy(state, 'drone', 110, y, 'sine')
  } else if (s === 4) {
    spawnEnemy(state, 'gunner', 24, 30, 'side')
    spawnEnemy(state, 'gunner', WIDTH - 42, 70, 'side')
    spawnEnemy(state, 'fan', 80 + Math.random() * 90, y, 'sine')
  } else if (s === 5) {
    spawnEnemy(state, 'tank', WIDTH / 2 - 10, y, 'hover')
    spawnEnemy(state, 'sniper', 36, y, 'dive')
    spawnEnemy(state, 'sniper', WIDTH - 50, y, 'dive')
  } else if (s === 6) {
    spawnEnemy(state, 'spinner', 60, y, 'hover')
    spawnEnemy(state, 'fan', 130, y, 'sine')
    spawnEnemy(state, 'gunner', 200, y, 'hover')
    spawnEnemy(state, 'drone', 90, y, 'dive')
  } else if (s === 7) {
    spawnEnemy(state, pick('spinner', 'tank'), 40 + Math.random() * 170, y, 'hover')
    spawnEnemy(state, 'sniper', 24, y, 'dive')
    spawnEnemy(state, 'sniper', WIDTH - 40, y, 'dive')
    spawnEnemy(state, 'fan', 100, y, 'sine')
    rain(state, 90, bulletColor(s, 1), 8)
  } else {
    spawnEnemy(state, 'spinner', 50, y, 'hover')
    spawnEnemy(state, 'gunner', 190, y, 'hover')
    spawnEnemy(state, 'sniper', 120, y, 'dive')
  }
}

function advancePhase(state) {
  const meta = STAGES[state.stage - 1]
  if (state.phase === 'intro') {
    if (state.introTimer <= 0) {
      state.phase = 'combat'
      spawnWave(state)
    }
    return
  }
  if (state.phase === 'combat') {
    if (state.stageTime >= meta.length && state.enemies.length === 0) {
      if (meta.hasBoss && !state.bossSpawned) {
        state.bossSpawned = true
        spawnBoss(state, meta.boss)
        state.banner = { text: meta.boss === 'boss' ? 'FINAL BOSS' : 'MID BOSS', sub: 'DANMAKU', time: 1.6 }
        state.phase = 'boss'
      } else {
        state.phase = 'clear'
        state.clearTimer = 1.8
        addScore(state, state.stage * 1500)
        state.banner = { text: 'STAGE CLEAR', sub: `+${state.stage * 1500}`, time: 1.8 }
        emit(state, 'clear')
      }
    }
    return
  }
  if (state.phase === 'boss' && state.enemies.length === 0) {
    state.phase = 'clear'
    state.clearTimer = 2.0
    addScore(state, state.stage * 2500)
    state.banner = { text: 'STAGE CLEAR', sub: `+${state.stage * 2500}`, time: 1.8 }
    emit(state, 'clear')
  }
  if (state.phase === 'clear' && state.clearTimer <= 0) {
    if (state.stage >= MAX_STAGES) {
      addScore(state, state.lives * 4000 + state.bombs * 1500)
      state.status = 'cleared'
    } else {
      startStage(state, state.stage + 1)
    }
  }
}

/**
 * @param {{ left?: boolean, right?: boolean, up?: boolean, down?: boolean, fire?: boolean, focus?: boolean, bomb?: boolean, dragX?: number|null, dragY?: number|null }} input
 */
export function updateGame(state, dt, input) {
  if (state.status === 'gameOver' || state.status === 'cleared') return state

  if (input.bomb) useBomb(state)

  state.stars.forEach((st) => {
    st.y += st.v * dt
    if (st.y > HEIGHT) {
      st.y = 0
      st.x = Math.random() * WIDTH
    }
  })

  if (state.banner) {
    state.banner.time -= dt
    if (state.banner.time <= 0) state.banner = null
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt)
  if (state.invincible > 0) state.invincible = Math.max(0, state.invincible - dt)
  if (state.bombTimer > 0) state.bombTimer = Math.max(0, state.bombTimer - dt)
  if (state.comboTimer > 0) {
    state.comboTimer -= dt
    if (state.comboTimer <= 0) state.combo = 0
  }

  if (state.phase === 'intro') state.introTimer -= dt
  if (state.phase === 'clear') {
    state.clearTimer -= dt
    state.enemyBullets = pruneBullets(state.enemyBullets.map((b) => {
      b.y += b.vy * dt
      b.x += b.vx * dt
      return b
    }))
    advancePhase(state)
    return state
  }

  if (typeof input.dragX === 'number' && typeof input.dragY === 'number') {
    state.player.x = clamp(input.dragX - PLAYER_W / 2, 2, WIDTH - PLAYER_W - 2)
    state.player.y = clamp(input.dragY - PLAYER_H / 2, 24, HEIGHT - PLAYER_H - 4)
  } else {
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
    if (dx && dy) {
      dx *= 0.707
      dy *= 0.707
    }
    const spd = input.focus ? FOCUS_SPEED : PLAYER_SPEED
    state.player.x = clamp(state.player.x + dx * spd * dt, 2, WIDTH - PLAYER_W - 2)
    state.player.y = clamp(state.player.y + dy * spd * dt, 24, HEIGHT - PLAYER_H - 4)
  }

  state.player.fireCd = Math.max(0, state.player.fireCd - dt)
  if (input.fire && state.phase !== 'intro') tryFirePlayer(state)

  if (state.phase === 'combat' || state.phase === 'boss') {
    state.stageTime += dt
    if (state.phase === 'combat') {
      const interval = Math.max(1.2, (3.2 - state.stage * 0.18) / difficulty(state.stage).density)
      state.waveAcc += dt
      if (state.waveAcc >= interval && state.stageTime < STAGES[state.stage - 1].length) {
        state.waveAcc = 0
        spawnWave(state)
      }
      if (state.stage === 2 || state.stage === 7) {
        state.rainAcc = (state.rainAcc || 0) + dt
        if (state.rainAcc >= 1.8 && state.stageTime < STAGES[state.stage - 1].length) {
          state.rainAcc = 0
          rain(state, 64 + state.stage * 4, bulletColor(state.stage), state.stage === 2 ? 5 : 7)
        }
      }
    }
  }

  for (let i = state.playerBullets.length - 1; i >= 0; i--) {
    const b = state.playerBullets[i]
    const prevY = b.y
    b.y += b.vy * dt
    if (b.y < -16) {
      state.playerBullets.splice(i, 1)
      continue
    }
    const left = b.x - BULLET_W / 2
    const right = b.x + BULLET_W / 2
    const top = Math.min(prevY, b.y) - BULLET_H / 2
    const bottom = Math.max(prevY, b.y) + BULLET_H / 2
    let hit = false
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j]
      const ex = e.x - ENEMY_HURT_PAD
      const ey = e.y - ENEMY_HURT_PAD
      const ew = e.w + ENEMY_HURT_PAD * 2
      const eh = e.h + ENEMY_HURT_PAD * 2
      if (right < ex || left > ex + ew || bottom < ey || top > ey + eh) continue
      state.playerBullets.splice(i, 1)
      e.hp -= 1
      e.flash = 0.1
      emit(state, 'hit')
      if (e.hp <= 0) {
        destroyEnemy(state, e)
        state.enemies.splice(j, 1)
      }
      hit = true
      break
    }
    if (hit) continue
  }

  state.enemyBullets.forEach((b) => {
    b.x += b.vx * dt
    b.y += b.vy * dt
  })
  state.enemyBullets = pruneBullets(state.enemyBullets)

  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i]
    if (enemy.flash > 0) enemy.flash = Math.max(0, enemy.flash - dt)
    moveEnemy(enemy, dt, state.stage)
    if (state.phase !== 'intro') fireEnemy(state, enemy, dt)
    if (enemy.y > HEIGHT + 30 || enemy.x < -40 || enemy.x > WIDTH + 40) {
      if (enemy.type !== 'midboss' && enemy.type !== 'boss') state.enemies.splice(i, 1)
    }
  }

  const pc = playerCenter(state)
  const hitR2 = HIT_RADIUS * HIT_RADIUS
  const grazeR2 = GRAZE_RADIUS * GRAZE_RADIUS
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i]
    const d2 = dist2(pc.x, pc.y, b.x, b.y)
    const rr = (b.r + HIT_RADIUS)
    if (d2 <= rr * rr) {
      state.enemyBullets.splice(i, 1)
      hitPlayer(state)
      if (state.status === 'gameOver') return state
      continue
    }
    if (!b.grazed && d2 < grazeR2) {
      b.grazed = true
      state.graze += 1
      addScore(state, 10)
    }
  }

  for (const e of state.enemies) {
    const ex = clamp(pc.x, e.x, e.x + e.w)
    const ey = clamp(pc.y, e.y, e.y + e.h)
    if (dist2(pc.x, pc.y, ex, ey) <= hitR2) {
      hitPlayer(state)
      if (state.status === 'gameOver') return state
    }
  }

  state.particles = state.particles.filter((p) => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life -= dt
    return p.life > 0
  })

  advancePhase(state)
  return state
}
