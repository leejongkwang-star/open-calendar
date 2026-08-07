export const WIDTH = 360
export const HEIGHT = 540

export const PLAYER_WIDTH = 28
export const PLAYER_HEIGHT = 20
export const PLAYER_Y = HEIGHT - 48
export const PLAYER_SPEED = 280

export const BULLET_WIDTH = 4
export const BULLET_HEIGHT = 10
export const PLAYER_BULLET_SPEED = 520
export const ENEMY_BULLET_SPEED = 220
export const FIRE_COOLDOWN = 0.25
export const MAX_PLAYER_BULLETS = 3

export const ENEMY_WIDTH = 24
export const ENEMY_HEIGHT = 20
export const FORMATION_SPEED = 60
export const FORMATION_DROP = 12
export const DIVE_SPEED = 220

export const LIVES = 3
export const INVINCIBLE_TIME = 1.5
export const COMBO_WINDOW = 2
export const MAX_WAVES = 5

export const ENEMY_TYPES = {
  grunt: { hp: 1, score: 100, color: '#60a5fa', canDive: false, canShoot: false },
  scout: { hp: 1, score: 150, color: '#34d399', canDive: true, canShoot: false },
  elite: { hp: 2, score: 300, color: '#f472b6', canDive: true, canShoot: true },
}

/** 웨이브별 적 배치 (행 단위, 중앙 정렬) */
export const WAVE_TEMPLATES = [
  [['grunt', 'grunt', 'grunt', 'grunt', 'grunt', 'grunt', 'grunt', 'grunt']],
  [
    ['scout', 'scout', 'scout', 'scout'],
    ['grunt', 'grunt', 'grunt', 'grunt', 'grunt', 'grunt'],
  ],
  [
    ['scout', 'elite', 'scout', 'elite', 'scout'],
    ['grunt', 'grunt', 'grunt', 'grunt', 'grunt', 'grunt'],
  ],
  [
    ['elite', 'scout', 'elite', 'scout', 'elite'],
    ['scout', 'grunt', 'scout', 'grunt', 'scout', 'grunt'],
    ['grunt', 'grunt', 'grunt', 'grunt'],
  ],
  [
    ['elite'],
    ['scout', 'elite', 'scout', 'elite', 'scout'],
    ['grunt', 'grunt', 'scout', 'scout', 'grunt', 'grunt'],
  ],
]
