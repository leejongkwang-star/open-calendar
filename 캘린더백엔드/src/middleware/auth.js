import jwt from 'jsonwebtoken'
import { prisma } from '../server.js'

// JWT 토큰 검증 미들웨어
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' })
    }

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ 
        message: '승인되지 않은 사용자입니다. 관리자 승인 후 로그인할 수 있습니다.' 
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '토큰이 만료되었습니다.' })
    }
    return res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' })
  }
}

// 관리자 권한 확인 미들웨어
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '인증이 필요합니다.' })
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다.' })
  }

  next()
}

