import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import teamsRoutes from './routes/teams.js'
import gamesRoutes from './routes/games.js'
import lottoRoutes from './routes/lotto.js'
import { errorHandler } from './middleware/errorHandler.js'

// 환경 변수 로드
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Prisma 클라이언트 초기화
// Supabase Pooler 모드 호환성을 위한 설정
const databaseUrl = process.env.DATABASE_URL

// DATABASE_URL에 Supabase Pooler 모드 호환 파라미터 추가
let finalDatabaseUrl = databaseUrl
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  const separator = databaseUrl.includes('?') ? '&' : '?'
  // connection_limit=1: 각 연결당 하나의 prepared statement만 사용
  // pool_timeout=0: 타임아웃 없음
  // pgbouncer=true: PgBouncer 모드 활성화 (Supabase Pooler와 호환)
  if (!databaseUrl.includes('connection_limit')) {
    finalDatabaseUrl = `${databaseUrl}${separator}connection_limit=1&pool_timeout=0&pgbouncer=true`
  } else if (!databaseUrl.includes('pgbouncer')) {
    finalDatabaseUrl = `${databaseUrl}&pgbouncer=true`
  }
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: finalDatabaseUrl,
    },
  },
})

// 미들웨어
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 로깅 미들웨어 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
  })
}

// 헬스 체크
app.get('/health', (req, res) => {
  // Accept 헤더에 따라 JSON 또는 HTML 응답
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>서버 상태 확인</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }
          .status {
            color: #10b981;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }
          .timestamp {
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 1rem;
          }
          .json-link {
            margin-top: 1.5rem;
            display: inline-block;
            color: #667eea;
            text-decoration: none;
            font-size: 0.9rem;
          }
          .json-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status">✓ 서버가 정상 작동 중입니다</div>
          <div class="timestamp">확인 시간: ${new Date().toLocaleString('ko-KR')}</div>
          <a href="/health?format=json" class="json-link">JSON 형식으로 보기</a>
        </div>
      </body>
      </html>
    `)
  } else {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  }
})

// API 라우트
app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/teams', teamsRoutes)
app.use('/api/games', gamesRoutes)
app.use('/api/lotto', lottoRoutes)

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' })
})

// 에러 핸들러
app.use(errorHandler)

// 서버 시작
// Cloud Run은 0.0.0.0에서 리스닝해야 함
const HOST = process.env.HOST || '0.0.0.0'
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 서버가 http://${HOST}:${PORT}에서 실행 중입니다.`)
  console.log(`📊 환경: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('서버가 종료되었습니다.')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('서버가 종료되었습니다.')
    process.exit(0)
  })
})

