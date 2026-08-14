export const WIDTH = 256
export const HEIGHT = 384

export const PLAYER_W = 14
export const PLAYER_H = 16
export const PLAYER_SPEED = 168
export const FOCUS_SPEED = 78
export const HIT_RADIUS = 2.6
export const GRAZE_RADIUS = 11

export const PLAYER_BULLET_SPEED = 360
export const FIRE_COOLDOWN = 0.1
export const MAX_PLAYER_BULLETS = 18
export const MAX_ENEMY_BULLETS = 280
export const BULLET_W = 5
export const BULLET_H = 10
export const ENEMY_HURT_PAD = 4

export const LIVES = 4
export const BOMBS = 3
export const INVINCIBLE_TIME = 2.4
export const BOMB_TIME = 1.05
export const RESPAWN_DELAY = 0.7
export const PLAYER_SPAWN_Y = HEIGHT - 56

export const MAX_STAGES = 8
export const EXTRA_LIFE_SCORES = [30000, 80000, 160000]

export const PALETTE = {
  bg: '#08060f',
  bg2: '#120c22',
  star1: '#ffffff',
  star2: '#7a6cff',
  star3: '#3d4a8a',
  player: ['#1ec8ff', '#ffffff', '#0b6db0'],
  hitbox: '#ff3b5c',
  pBullet: '#fff36b',
  hud: '#f4e8c1',
}

export const ENEMY_DEFS = {
  drone: { hp: 3, score: 200, w: 16, h: 16, colors: ['#ff5d5d', '#ffd15a'] },
  fan: { hp: 5, score: 350, w: 18, h: 16, colors: ['#5dff8a', '#d6ff7a'] },
  spinner: { hp: 8, score: 500, w: 18, h: 18, colors: ['#c45dff', '#ffa6ff'] },
  gunner: { hp: 10, score: 600, w: 20, h: 16, colors: ['#5dd6ff', '#ffe08a'] },
  sniper: { hp: 4, score: 400, w: 14, h: 18, colors: ['#ff8a3d', '#fff1a8'] },
  tank: { hp: 16, score: 900, w: 22, h: 20, colors: ['#8a8a8a', '#ffe066'] },
  midboss: { hp: 90, score: 5000, w: 64, h: 44, colors: ['#c45dff', '#ffa6ff', '#fff36b', '#5b1d8a'] },
  boss: { hp: 180, score: 15000, w: 80, h: 54, colors: ['#ff2d55', '#7af7ff', '#ffe566', '#7a1030'] },
}

export const STAGES = [
  { name: 'STAGE 1', title: 'ORBIT ENTRY', length: 22, hasBoss: false },
  { name: 'STAGE 2', title: 'METEOR RAIN', length: 24, hasBoss: false },
  { name: 'STAGE 3', title: 'SPIRAL GATE', length: 20, hasBoss: true, boss: 'midboss' },
  { name: 'STAGE 4', title: 'CROSSFIRE', length: 26, hasBoss: false },
  { name: 'STAGE 5', title: 'VOID CANNON', length: 18, hasBoss: true, boss: 'midboss' },
  { name: 'STAGE 6', title: 'BULLET HELL', length: 28, hasBoss: false },
  { name: 'STAGE 7', title: 'OVERLOAD', length: 30, hasBoss: false },
  { name: 'STAGE 8', title: 'FINAL CORE', length: 14, hasBoss: true, boss: 'boss' },
]

export function difficulty(stage) {
  const t = Math.max(0, stage - 1)
  return {
    speed: 1 + t * 0.16,
    density: 1 + t * 0.18,
    hp: 1 + t * 0.22,
    fire: Math.max(0.42, 1 - t * 0.07),
  }
}
