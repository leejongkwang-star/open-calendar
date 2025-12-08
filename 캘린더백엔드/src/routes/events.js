import express from 'express'
import { body, query, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate)

// 이벤트 목록 조회
router.get(
  '/',
  [
    query('teamId').optional().isInt().withMessage('팀 ID는 숫자여야 합니다.'),
    query('startDate').optional().isISO8601().withMessage('시작일은 유효한 날짜 형식이어야 합니다.'),
    query('endDate').optional().isISO8601().withMessage('종료일은 유효한 날짜 형식이어야 합니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { teamId, startDate, endDate } = req.query
      const userId = req.user.id

      // 사용자가 속한 팀 조회
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      })

      const teamIds = userTeams.map((tm) => tm.teamId)

      if (teamIds.length === 0) {
        return res.json([])
      }

      // 필터 조건 구성
      const where = {
        teamId: teamId ? parseInt(teamId) : { in: teamIds },
      }

      if (startDate || endDate) {
        where.OR = []
        if (startDate && endDate) {
          where.OR.push({
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          })
        } else if (startDate) {
          where.endDate = { gte: new Date(startDate) }
        } else if (endDate) {
          where.startDate = { lte: new Date(endDate) }
        }
      }

      const events = await prisma.event.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startDate: 'asc' },
      })

      // react-big-calendar 형식으로 변환
      const formattedEvents = events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        description: event.description,
        userId: event.userId,
        userName: event.user.name,
        teamId: event.teamId,
        teamName: event.team.name,
      }))

      res.json(formattedEvents)
    } catch (error) {
      next(error)
    }
  }
)

// 이벤트 상세 조회
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeNumber: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!event) {
      return res.status(404).json({ message: '이벤트를 찾을 수 없습니다.' })
    }

    // 사용자가 해당 팀의 구성원인지 확인
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: event.teamId,
          userId,
        },
      },
    })

    if (!teamMember) {
      return res.status(403).json({ message: '이 이벤트에 접근할 권한이 없습니다.' })
    }

    res.json({
      id: event.id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      eventType: event.eventType,
      description: event.description,
      userId: event.userId,
      userName: event.user.name,
      teamId: event.teamId,
      teamName: event.team.name,
    })
  } catch (error) {
    next(error)
  }
})

// 이벤트 생성
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('제목을 입력해주세요.'),
    body('startDate').isISO8601().withMessage('시작일은 유효한 날짜 형식이어야 합니다.'),
    body('endDate').isISO8601().withMessage('종료일은 유효한 날짜 형식이어야 합니다.'),
    body('eventType').isIn(['VACATION', 'MEETING', 'OTHER']).withMessage('일정 유형이 올바르지 않습니다.'),
    body('teamId').isInt().withMessage('팀 ID는 숫자여야 합니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { title, startDate, endDate, startTime, endTime, eventType, description, teamId } =
        req.body
      const userId = req.user.id

      // 시작일이 종료일보다 이전인지 확인
      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ message: '시작일은 종료일보다 이전이어야 합니다.' })
      }

      // 사용자가 해당 팀의 구성원인지 확인
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: parseInt(teamId),
            userId,
          },
        },
      })

      if (!teamMember) {
        return res.status(403).json({ message: '해당 팀의 구성원만 일정을 등록할 수 있습니다.' })
      }

      const event = await prisma.event.create({
        data: {
          title,
          description,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          eventType,
          userId,
          teamId: parseInt(teamId),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      res.status(201).json({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        description: event.description,
        userId: event.userId,
        userName: event.user.name,
        teamId: event.teamId,
        teamName: event.team.name,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 이벤트 수정
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('제목을 입력해주세요.'),
    body('startDate').optional().isISO8601().withMessage('시작일은 유효한 날짜 형식이어야 합니다.'),
    body('endDate').optional().isISO8601().withMessage('종료일은 유효한 날짜 형식이어야 합니다.'),
    body('eventType').optional().isIn(['휴가', '회의', '기타']).withMessage('일정 유형이 올바르지 않습니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { id } = req.params
      const userId = req.user.id
      const { title, startDate, endDate, startTime, endTime, eventType, description } = req.body

      // 이벤트 조회
      const event = await prisma.event.findUnique({
        where: { id: parseInt(id) },
      })

      if (!event) {
        return res.status(404).json({ message: '이벤트를 찾을 수 없습니다.' })
      }

      // 권한 확인: 본인이거나 관리자만 수정 가능
      if (event.userId !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: '이 이벤트를 수정할 권한이 없습니다.' })
      }

      // 업데이트 데이터 구성
      const updateData = {}
      if (title) updateData.title = title
      if (startDate) updateData.startDate = new Date(startDate)
      if (endDate) updateData.endDate = new Date(endDate)
      if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : null
      if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null
      if (eventType) updateData.eventType = eventType
      if (description !== undefined) updateData.description = description

      // 시작일이 종료일보다 이전인지 확인
      const finalStartDate = updateData.startDate || event.startDate
      const finalEndDate = updateData.endDate || event.endDate
      if (new Date(finalStartDate) > new Date(finalEndDate)) {
        return res.status(400).json({ message: '시작일은 종료일보다 이전이어야 합니다.' })
      }

      const updatedEvent = await prisma.event.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNumber: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      res.json({
        id: updatedEvent.id,
        title: updatedEvent.title,
        start: updatedEvent.startDate,
        end: updatedEvent.endDate,
        startTime: updatedEvent.startTime,
        endTime: updatedEvent.endTime,
        eventType: updatedEvent.eventType,
        description: updatedEvent.description,
        userId: updatedEvent.userId,
        userName: updatedEvent.user.name,
        teamId: updatedEvent.teamId,
        teamName: updatedEvent.team.name,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 이벤트 삭제
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // 이벤트 조회
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
    })

    if (!event) {
      return res.status(404).json({ message: '이벤트를 찾을 수 없습니다.' })
    }

    // 권한 확인: 본인이거나 관리자만 삭제 가능
    if (event.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: '이 이벤트를 삭제할 권한이 없습니다.' })
    }

    await prisma.event.delete({
      where: { id: parseInt(id) },
    })

    res.json({ message: '이벤트가 삭제되었습니다.' })
  } catch (error) {
    next(error)
  }
})

export default router

