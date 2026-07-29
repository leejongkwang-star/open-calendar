import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 진행 중인(종료되지 않은) 단식 세션 조회 (인증 필요)
router.get('/active', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id

    const activeSession = await prisma.fastingSession.findFirst({
      where: { userId, endTime: null },
      orderBy: { startTime: 'desc' },
    })

    res.json({ session: activeSession })
  } catch (error) {
    next(error)
  }
})

// 단식 시작 (인증 필요)
router.post(
  '/start',
  authenticate,
  [
    body('startTime').optional().isISO8601().withMessage('startTime은 유효한 날짜여야 합니다.'),
    body('targetHours')
      .optional({ nullable: true })
      .isInt({ min: 1, max: 168 })
      .withMessage('목표 시간은 1-168 사이의 숫자여야 합니다.'),
    body('note').optional({ nullable: true }).isString().withMessage('메모는 문자열이어야 합니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const userId = req.user.id
      const { startTime, targetHours, note } = req.body

      // 이미 진행 중인 단식이 있으면 거부
      const existing = await prisma.fastingSession.findFirst({
        where: { userId, endTime: null },
      })

      if (existing) {
        return res.status(409).json({
          message: '이미 진행 중인 단식이 있습니다. 먼저 종료해주세요.',
          session: existing,
        })
      }

      const session = await prisma.fastingSession.create({
        data: {
          userId,
          startTime: startTime ? new Date(startTime) : new Date(),
          targetHours: targetHours ?? null,
          note: note ?? null,
        },
      })

      res.status(201).json({ message: '단식을 시작했습니다.', session })
    } catch (error) {
      next(error)
    }
  }
)

// 단식 종료 (진행 중인 세션 종료) (인증 필요)
router.post(
  '/stop',
  authenticate,
  [body('endTime').optional().isISO8601().withMessage('endTime은 유효한 날짜여야 합니다.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const userId = req.user.id
      const { endTime } = req.body

      const activeSession = await prisma.fastingSession.findFirst({
        where: { userId, endTime: null },
        orderBy: { startTime: 'desc' },
      })

      if (!activeSession) {
        return res.status(404).json({ message: '진행 중인 단식이 없습니다.' })
      }

      const finalEnd = endTime ? new Date(endTime) : new Date()

      // 종료 시간이 시작 시간보다 빠르면 거부
      if (finalEnd.getTime() < new Date(activeSession.startTime).getTime()) {
        return res.status(400).json({ message: '종료 시간은 시작 시간보다 이후여야 합니다.' })
      }

      const session = await prisma.fastingSession.update({
        where: { id: activeSession.id },
        data: { endTime: finalEnd },
      })

      const durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      const durationHours = durationMs / (1000 * 60 * 60)

      res.json({
        message: '단식을 종료했습니다.',
        session,
        durationHours: Math.round(durationHours * 100) / 100,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 내 단식 기록 목록 조회 (인증 필요)
router.get(
  '/sessions',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit은 1-200 사이의 숫자여야 합니다.'),
    query('offset').optional().isInt({ min: 0 }).withMessage('offset은 0 이상의 숫자여야 합니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const userId = req.user.id
      const limit = parseInt(req.query.limit) || 30
      const offset = parseInt(req.query.offset) || 0

      const [sessions, total] = await Promise.all([
        prisma.fastingSession.findMany({
          where: { userId },
          orderBy: { startTime: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.fastingSession.count({ where: { userId } }),
      ])

      res.json({ sessions, total, limit, offset })
    } catch (error) {
      next(error)
    }
  }
)

// 팀/전체 직원의 현재 단식 현황 (진행 중인 세션) (인증 필요)
router.get('/team-status', authenticate, async (req, res, next) => {
  try {
    const activeSessions = await prisma.fastingSession.findMany({
      where: { endTime: null },
      orderBy: { startTime: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, employeeNumber: true },
        },
      },
    })

    const now = Date.now()
    const status = activeSessions.map((s) => ({
      sessionId: s.id,
      userId: s.userId,
      userName: s.user.name,
      employeeNumber: s.user.employeeNumber,
      startTime: s.startTime,
      targetHours: s.targetHours,
      elapsedHours: Math.round(((now - new Date(s.startTime).getTime()) / (1000 * 60 * 60)) * 100) / 100,
      isMe: s.userId === req.user.id,
    }))

    res.json({ status })
  } catch (error) {
    next(error)
  }
})

// 단식 기록 삭제 (본인 기록만) (인증 필요)
router.delete(
  '/sessions/:id',
  authenticate,
  [param('id').isInt().withMessage('유효한 ID가 아닙니다.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const userId = req.user.id
      const id = parseInt(req.params.id)

      const session = await prisma.fastingSession.findFirst({
        where: { id, userId },
      })

      if (!session) {
        return res.status(404).json({ message: '단식 기록을 찾을 수 없습니다.' })
      }

      await prisma.fastingSession.delete({ where: { id } })

      res.json({ message: '단식 기록이 삭제되었습니다.' })
    } catch (error) {
      next(error)
    }
  }
)

export default router
