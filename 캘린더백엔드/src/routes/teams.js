import express from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// 모든 라우트에 인증 미들웨어 적용
router.use(authenticate)

// 팀 목록 조회
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id

    // 사용자가 속한 팀 조회
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    })

    const teams = teamMembers.map((tm) => ({
      id: tm.team.id,
      name: tm.team.name,
      description: tm.team.description,
      memberCount: tm.team._count.members,
      role: tm.role,
      createdAt: tm.team.createdAt,
    }))

    res.json(teams)
  } catch (error) {
    next(error)
  }
})

// 팀 상세 조회
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // 사용자가 해당 팀의 구성원인지 확인
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: parseInt(id),
          userId,
        },
      },
      include: {
        team: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    })

    if (!teamMember) {
      return res.status(403).json({ message: '이 팀에 접근할 권한이 없습니다.' })
    }

    res.json({
      id: teamMember.team.id,
      name: teamMember.team.name,
      description: teamMember.team.description,
      memberCount: teamMember.team._count.members,
      role: teamMember.role,
      createdAt: teamMember.team.createdAt,
    })
  } catch (error) {
    next(error)
  }
})

// 팀 생성 (관리자만)
router.post(
  '/',
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('팀 이름을 입력해주세요.'),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { name, description } = req.body
      const userId = req.user.id

      const team = await prisma.team.create({
        data: {
          name,
          description,
          createdBy: userId,
        },
        include: {
          _count: {
            select: { members: true },
          },
        },
      })

      res.status(201).json({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: team._count.members,
        createdAt: team.createdAt,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 팀 수정 (관리자만)
router.put(
  '/:id',
  requireAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('팀 이름을 입력해주세요.'),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { id } = req.params
      const { name, description } = req.body

      const team = await prisma.team.findUnique({
        where: { id: parseInt(id) },
        include: {
          _count: {
            select: { members: true },
          },
        },
      })

      if (!team) {
        return res.status(404).json({ message: '팀을 찾을 수 없습니다.' })
      }

      const updateData = {}
      if (name) updateData.name = name
      if (description !== undefined) updateData.description = description

      const updatedTeam = await prisma.team.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          _count: {
            select: { members: true },
          },
        },
      })

      res.json({
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        memberCount: updatedTeam._count.members,
        createdAt: updatedTeam.createdAt,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 팀 삭제 (관리자만, 구성원이 없을 때만)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { members: true },
        },
      },
    })

    if (!team) {
      return res.status(404).json({ message: '팀을 찾을 수 없습니다.' })
    }

    if (team._count.members > 0) {
      return res.status(400).json({ message: '구성원이 있는 팀은 삭제할 수 없습니다.' })
    }

    await prisma.team.delete({
      where: { id: parseInt(id) },
    })

    res.json({ message: '팀이 삭제되었습니다.' })
  } catch (error) {
    next(error)
  }
})

// 구성원 목록 조회
router.get('/:teamId/members', async (req, res, next) => {
  try {
    const { teamId } = req.params
    const userId = req.user.id

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
      return res.status(403).json({ message: '이 팀에 접근할 권한이 없습니다.' })
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: parseInt(teamId) },
      include: {
        user: {
          select: {
            id: true,
            employeeNumber: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const formattedMembers = members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      name: member.user.name,
      employeeNumber: member.user.employeeNumber,
      position: member.position,
      phone: member.phone,
      role: member.role,
      createdAt: member.createdAt,
    }))

    res.json(formattedMembers)
  } catch (error) {
    next(error)
  }
})

// 구성원 추가 (관리자만)
router.post(
  '/:teamId/members',
  requireAdmin,
  [
    body('userId').isInt().withMessage('사용자 ID는 숫자여야 합니다.'),
    body('position').optional().trim(),
    body('phone').optional().trim(),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('권한이 올바르지 않습니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { teamId } = req.params
      const { userId, position, phone, role } = req.body

      // 팀 존재 확인
      const team = await prisma.team.findUnique({
        where: { id: parseInt(teamId) },
      })

      if (!team) {
        return res.status(404).json({ message: '팀을 찾을 수 없습니다.' })
      }

      // 사용자 존재 및 승인 상태 확인
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      })

      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
      }

      if (user.status !== 'APPROVED') {
        return res.status(400).json({ message: '승인된 사용자만 팀에 추가할 수 있습니다.' })
      }

      // 중복 확인
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: parseInt(teamId),
            userId: parseInt(userId),
          },
        },
      })

      if (existingMember) {
        return res.status(409).json({ message: '이미 팀에 속한 구성원입니다.' })
      }

      const member = await prisma.teamMember.create({
        data: {
          teamId: parseInt(teamId),
          userId: parseInt(userId),
          position,
          phone,
          role: role || 'MEMBER',
        },
        include: {
          user: {
            select: {
              id: true,
              employeeNumber: true,
              name: true,
            },
          },
        },
      })

      res.status(201).json({
        id: member.id,
        userId: member.user.id,
        name: member.user.name,
        employeeNumber: member.user.employeeNumber,
        position: member.position,
        phone: member.phone,
        role: member.role,
        createdAt: member.createdAt,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 구성원 수정 (관리자만)
router.put(
  '/:teamId/members/:memberId',
  requireAdmin,
  [
    body('position').optional().trim(),
    body('phone').optional().trim(),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('권한이 올바르지 않습니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { teamId, memberId } = req.params
      const { position, phone, role } = req.body

      const member = await prisma.teamMember.findUnique({
        where: { id: parseInt(memberId) },
        include: {
          user: {
            select: {
              id: true,
              employeeNumber: true,
              name: true,
            },
          },
        },
      })

      if (!member || member.teamId !== parseInt(teamId)) {
        return res.status(404).json({ message: '구성원을 찾을 수 없습니다.' })
      }

      const updateData = {}
      if (position !== undefined) updateData.position = position
      if (phone !== undefined) updateData.phone = phone
      if (role) updateData.role = role

      const updatedMember = await prisma.teamMember.update({
        where: { id: parseInt(memberId) },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              employeeNumber: true,
              name: true,
            },
          },
        },
      })

      res.json({
        id: updatedMember.id,
        userId: updatedMember.user.id,
        name: updatedMember.user.name,
        employeeNumber: updatedMember.user.employeeNumber,
        position: updatedMember.position,
        phone: updatedMember.phone,
        role: updatedMember.role,
        createdAt: updatedMember.createdAt,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 구성원 삭제 (관리자만)
router.delete('/:teamId/members/:memberId', requireAdmin, async (req, res, next) => {
  try {
    const { teamId, memberId } = req.params

    const member = await prisma.teamMember.findUnique({
      where: { id: parseInt(memberId) },
    })

    if (!member || member.teamId !== parseInt(teamId)) {
      return res.status(404).json({ message: '구성원을 찾을 수 없습니다.' })
    }

    await prisma.teamMember.delete({
      where: { id: parseInt(memberId) },
    })

    res.json({ message: '구성원이 팀에서 제거되었습니다.' })
  } catch (error) {
    next(error)
  }
})

// 구성원 권한 변경 (관리자만)
router.patch(
  '/:teamId/members/:memberId/role',
  requireAdmin,
  [body('role').isIn(['ADMIN', 'MEMBER']).withMessage('권한이 올바르지 않습니다.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { teamId, memberId } = req.params
      const { role } = req.body

      const member = await prisma.teamMember.findUnique({
        where: { id: parseInt(memberId) },
        include: {
          user: {
            select: {
              id: true,
              employeeNumber: true,
              name: true,
            },
          },
        },
      })

      if (!member || member.teamId !== parseInt(teamId)) {
        return res.status(404).json({ message: '구성원을 찾을 수 없습니다.' })
      }

      // 최소 1명의 관리자 유지 확인
      if (member.role === 'ADMIN' && role === 'MEMBER') {
        const adminCount = await prisma.teamMember.count({
          where: {
            teamId: parseInt(teamId),
            role: 'ADMIN',
          },
        })

        if (adminCount <= 1) {
          return res.status(400).json({ message: '팀에는 최소 1명의 관리자가 필요합니다.' })
        }
      }

      const updatedMember = await prisma.teamMember.update({
        where: { id: parseInt(memberId) },
        data: { role },
        include: {
          user: {
            select: {
              id: true,
              employeeNumber: true,
              name: true,
            },
          },
        },
      })

      res.json({
        id: updatedMember.id,
        userId: updatedMember.user.id,
        name: updatedMember.user.name,
        employeeNumber: updatedMember.user.employeeNumber,
        position: updatedMember.position,
        phone: updatedMember.phone,
        role: updatedMember.role,
        createdAt: updatedMember.createdAt,
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router

