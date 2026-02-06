import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 게임 타입별 정렬 방향 정의
const GAME_SORT_ORDER = {
  GAME_2048: 'desc', // 높은 점수가 좋음
  SNAKE: 'desc', // 높은 점수가 좋음
  TETRIS: 'desc', // 높은 점수가 좋음
  REACTION: 'asc', // 낮은 점수가 좋음 (시간)
  ROCK_PAPER_SCISSORS: 'desc', // 높은 승률이 좋음
  TIC_TAC_TOE: 'desc', // 높은 승률이 좋음
  SUDOKU: 'asc', // 낮은 점수가 좋음 (시간)
}

// 점수 저장 (인증 필요)
router.post(
  '/scores',
  authenticate,
  [
    body('gameType')
      .isIn(['GAME_2048', 'SNAKE', 'TETRIS', 'REACTION', 'ROCK_PAPER_SCISSORS', 'TIC_TAC_TOE', 'SUDOKU'])
      .withMessage('유효한 게임 타입이 아닙니다.'),
    body('score').isFloat({ min: 0 }).withMessage('점수는 0 이상의 숫자여야 합니다.'),
    body('metadata')
      .optional({ nullable: true })
      .isObject()
      .withMessage('metadata는 객체여야 합니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const { gameType, score, metadata } = req.body
      const userId = req.user.id

      // 기존 최고 기록 조회
      const existingScore = await prisma.gameScore.findUnique({
        where: {
          userId_gameType: {
            userId,
            gameType,
          },
        },
      })

      // 점수 비교 로직
      let shouldUpdate = false
      if (!existingScore) {
        shouldUpdate = true
      } else {
        const sortOrder = GAME_SORT_ORDER[gameType]
        if (sortOrder === 'desc') {
          // 높은 점수가 좋은 게임
          shouldUpdate = score > existingScore.score
        } else {
          // 낮은 점수가 좋은 게임
          shouldUpdate = score < existingScore.score
        }
      }

      if (!shouldUpdate) {
        return res.json({
          message: '기존 기록보다 좋지 않습니다.',
          score: existingScore,
        })
      }

      // 점수 저장 또는 업데이트
      const gameScore = await prisma.gameScore.upsert({
        where: {
          userId_gameType: {
            userId,
            gameType,
          },
        },
        update: {
          score,
          metadata: metadata || null,
          updatedAt: new Date(),
        },
        create: {
          userId,
          gameType,
          score,
          metadata: metadata || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
        },
      })

      res.status(201).json({
        message: '점수가 저장되었습니다.',
        score: gameScore,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 특정 게임의 랭킹 조회 (인증 불필요)
router.get(
  '/scores/:gameType',
  [
    param('gameType')
      .isIn(['GAME_2048', 'SNAKE', 'TETRIS', 'REACTION', 'ROCK_PAPER_SCISSORS', 'TIC_TAC_TOE', 'SUDOKU'])
      .withMessage('유효한 게임 타입이 아닙니다.'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit은 1-1000 사이의 숫자여야 합니다.'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset은 0 이상의 숫자여야 합니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const { gameType } = req.params
      const limit = parseInt(req.query.limit) || 100
      const offset = parseInt(req.query.offset) || 0
      const sortOrder = GAME_SORT_ORDER[gameType] || 'desc'

      // 전체 개수 조회
      const total = await prisma.gameScore.count({
        where: { gameType },
      })

      // 랭킹 조회 (점수 정렬)
      const scores = await prisma.gameScore.findMany({
        where: { gameType },
        orderBy: {
          score: sortOrder,
        },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
        },
      })

      // 등수 계산 (offset을 고려)
      const rankings = scores.map((score, index) => ({
        rank: offset + index + 1,
        userId: score.userId,
        userName: score.user.name,
        employeeNumber: score.user.employeeNumber,
        score: score.score,
        metadata: score.metadata,
        createdAt: score.createdAt,
      }))

      res.json({
        rankings,
        total,
        limit,
        offset,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 내 최고 기록 조회 (인증 필요)
router.get(
  '/scores/:gameType/my',
  authenticate,
  [
    param('gameType')
      .isIn(['GAME_2048', 'SNAKE', 'TETRIS', 'REACTION', 'ROCK_PAPER_SCISSORS', 'TIC_TAC_TOE', 'SUDOKU'])
      .withMessage('유효한 게임 타입이 아닙니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const { gameType } = req.params
      const userId = req.user.id

      const myScore = await prisma.gameScore.findUnique({
        where: {
          userId_gameType: {
            userId,
            gameType,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
        },
      })

      if (!myScore) {
        return res.json({
          score: null,
          message: '기록이 없습니다.',
        })
      }

      // 내 등수 계산
      const sortOrder = GAME_SORT_ORDER[gameType] || 'desc'
      const betterScores = await prisma.gameScore.count({
        where: {
          gameType,
          score: sortOrder === 'desc' ? { gt: myScore.score } : { lt: myScore.score },
        },
      })

      const rank = betterScores + 1

      res.json({
        score: myScore,
        rank,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 내 주변 랭킹 조회 (인증 필요)
router.get(
  '/scores/:gameType/around-me',
  authenticate,
  [
    param('gameType')
      .isIn(['GAME_2048', 'SNAKE', 'TETRIS', 'REACTION', 'ROCK_PAPER_SCISSORS', 'TIC_TAC_TOE', 'SUDOKU'])
      .withMessage('유효한 게임 타입이 아닙니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const { gameType } = req.params
      const userId = req.user.id
      const sortOrder = GAME_SORT_ORDER[gameType] || 'desc'

      // 내 점수 조회
      const myScore = await prisma.gameScore.findUnique({
        where: {
          userId_gameType: {
            userId,
            gameType,
          },
        },
      })

      if (!myScore) {
        return res.json({
          message: '기록이 없습니다.',
          rankings: [],
          myRank: null,
        })
      }

      // 내보다 좋은 점수 개수 (내 등수 계산)
      const betterCount = await prisma.gameScore.count({
        where: {
          gameType,
          score: sortOrder === 'desc' ? { gt: myScore.score } : { lt: myScore.score },
        },
      })

      const myRank = betterCount + 1

      // 내 위 5명 조회
      const aboveScores = await prisma.gameScore.findMany({
        where: {
          gameType,
          score: sortOrder === 'desc' ? { gt: myScore.score } : { lt: myScore.score },
        },
        orderBy: {
          score: sortOrder,
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
        },
      })

      // 내 아래 5명 조회
      const belowScores = await prisma.gameScore.findMany({
        where: {
          gameType,
          score: sortOrder === 'desc' ? { lt: myScore.score } : { gt: myScore.score },
        },
        orderBy: {
          score: sortOrder === 'desc' ? 'desc' : 'asc',
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
        },
      })

      // 내 정보 포함
      const myScoreWithUser = await prisma.gameScore.findUnique({
        where: {
          userId_gameType: {
            userId,
            gameType,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
        },
      })

      // 랭킹 배열 구성 (위 5명 + 나 + 아래 5명)
      const rankings = []
      
      // 위 5명
      aboveScores.reverse().forEach((score, index) => {
        rankings.push({
          rank: myRank - aboveScores.length + index,
          userId: score.userId,
          userName: score.user.name,
          employeeNumber: score.user.employeeNumber,
          score: score.score,
          metadata: score.metadata,
          createdAt: score.createdAt,
          isMe: false,
        })
      })

      // 나
      rankings.push({
        rank: myRank,
        userId: myScoreWithUser.userId,
        userName: myScoreWithUser.user.name,
        employeeNumber: myScoreWithUser.user.employeeNumber,
        score: myScoreWithUser.score,
        metadata: myScoreWithUser.metadata,
        createdAt: myScoreWithUser.createdAt,
        isMe: true,
      })

      // 아래 5명
      belowScores.forEach((score, index) => {
        rankings.push({
          rank: myRank + index + 1,
          userId: score.userId,
          userName: score.user.name,
          employeeNumber: score.user.employeeNumber,
          score: score.score,
          metadata: score.metadata,
          createdAt: score.createdAt,
          isMe: false,
        })
      })

      res.json({
        rankings,
        myRank,
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router

