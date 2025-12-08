import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { prisma } from '../server.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// 직원번호 중복 확인
router.get('/check-employee-number', async (req, res, next) => {
  try {
    const { employeeNumber } = req.query

    if (!employeeNumber) {
      return res.status(400).json({ message: '직원번호를 입력해주세요.' })
    }

    // 6자리 영문+숫자 조합 검증
    const employeeNumberRegex = /^[A-Za-z0-9]{6}$/
    if (!employeeNumberRegex.test(employeeNumber)) {
      return res.status(400).json({ message: '직원번호는 6자리 영문과 숫자 조합이어야 합니다.' })
    }

    const hasLetter = /[A-Za-z]/.test(employeeNumber)
    const hasNumber = /[0-9]/.test(employeeNumber)
    if (!hasLetter || !hasNumber) {
      return res.status(400).json({ message: '직원번호는 영문과 숫자를 모두 포함해야 합니다.' })
    }

    const user = await prisma.user.findUnique({
      where: { employeeNumber: employeeNumber.toUpperCase() },
    })

    res.json({ exists: !!user })
  } catch (error) {
    next(error)
  }
})

// 회원가입
router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('이름은 2자 이상이어야 합니다.'),
    body('employeeNumber')
      .trim()
      .matches(/^[A-Za-z0-9]{6}$/)
      .withMessage('직원번호는 6자리 영문과 숫자 조합이어야 합니다.'),
    body('password').isLength({ min: 8 }).withMessage('비밀번호는 8자 이상이어야 합니다.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() })
      }

      const { name, employeeNumber, password } = req.body

      // 직원번호 중복 확인
      const existingUser = await prisma.user.findUnique({
        where: { employeeNumber: employeeNumber.toUpperCase() },
      })

      if (existingUser) {
        return res.status(409).json({ message: '이미 사용 중인 직원번호입니다.' })
      }

      // 비밀번호 암호화
      const hashedPassword = await bcrypt.hash(password, 10)

      // 사용자 생성 (승인 대기 상태)
      const user = await prisma.user.create({
        data: {
          name,
          employeeNumber: employeeNumber.toUpperCase(),
          password: hashedPassword,
          role: 'MEMBER',
          status: 'PENDING',
        },
        select: {
          id: true,
          employeeNumber: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      })

      res.status(201).json({
        message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
        user,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 로그인
router.post(
  '/login',
  [
    body('employeeNumber').trim().notEmpty().withMessage('직원번호를 입력해주세요.'),
    body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { employeeNumber, password } = req.body

      // 사용자 조회
      const user = await prisma.user.findUnique({
        where: { employeeNumber: employeeNumber.toUpperCase() },
      })

      if (!user) {
        return res.status(401).json({ message: '직원번호 또는 비밀번호가 올바르지 않습니다.' })
      }

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).json({ message: '직원번호 또는 비밀번호가 올바르지 않습니다.' })
      }

      // 승인 상태 확인
      if (user.status === 'PENDING') {
        return res.status(403).json({
          message: '관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.',
        })
      }

      if (user.status === 'REJECTED') {
        return res.status(403).json({
          message: '회원가입이 거부되었습니다. 관리자에게 문의하세요.',
        })
      }

      if (user.status !== 'APPROVED') {
        return res.status(403).json({
          message: '로그인할 수 없는 상태입니다. 관리자에게 문의하세요.',
        })
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { userId: user.id, employeeNumber: user.employeeNumber },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      )

      res.json({
        user: {
          id: user.id,
          employeeNumber: user.employeeNumber,
          name: user.name,
          role: user.role,
        },
        token,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 현재 사용자 정보 조회
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// 승인 대기 사용자 목록 조회 (관리자)
router.get('/pending', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(pendingUsers)
  } catch (error) {
    next(error)
  }
})

// 사용자 승인 (관리자)
router.post('/approve/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params
    const adminId = req.user.id

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    })

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({ message: '승인 대기 중인 사용자만 승인할 수 있습니다.' })
    }

    const approvedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
      },
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        status: true,
        approvedAt: true,
      },
    })

    res.json({
      message: '회원가입이 승인되었습니다.',
      user: approvedUser,
    })
  } catch (error) {
    next(error)
  }
})

// 사용자 거부 (관리자)
router.post(
  '/reject/:userId',
  authenticate,
  requireAdmin,
  [body('reason').optional().trim()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
      }

      const { userId } = req.params
      const { reason } = req.body
      const adminId = req.user.id

      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
      })

      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
      }

      if (user.status !== 'PENDING') {
        return res.status(400).json({ message: '승인 대기 중인 사용자만 거부할 수 있습니다.' })
      }

      const rejectedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          status: 'REJECTED',
          rejectionReason: reason || null,
        },
        select: {
          id: true,
          employeeNumber: true,
          name: true,
          status: true,
          rejectionReason: true,
        },
      })

      res.json({
        message: '회원가입이 거부되었습니다.',
        user: rejectedUser,
      })
    } catch (error) {
      next(error)
    }
  }
)

// 로그아웃 (클라이언트에서 토큰 삭제)
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: '로그아웃되었습니다.' })
})

export default router

