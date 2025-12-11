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

      // 필터 조건 구성
      // 캘린더의 목적: 모든 팀의 일정을 공유하여 서로 일정을 알 수 있도록 함
      const where = {}
      
      if (teamId) {
        // 특정 팀 선택 시: 해당 팀의 일정만 조회
        where.teamId = parseInt(teamId)
      }
      // teamId가 없으면: 모든 팀의 일정 조회 (공유 목적)
      // where에 teamId 조건을 추가하지 않으면 모든 팀의 일정이 조회됨

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
              teams: {
                select: {
                  phone: true,
                  teamId: true,
                },
                take: 1, // 첫 번째 팀의 전화번호만
              },
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
      // 이전 데이터 호환성: startTime/endTime이 별도로 있는 경우 startDate/endDate와 결합
      const formattedEvents = events.map((event) => {
        // startDate와 startTime 결합 로직 (간소화)
        let start = null
        
        if (event.startDate) {
          // startDate가 있으면 우선 사용
          start = new Date(event.startDate)
          
          // startTime이 있고 startDate가 자정(00:00:00)이면 startTime의 시간을 적용
          if (event.startTime) {
            const startDateObj = new Date(event.startDate)
            const startTimeObj = new Date(event.startTime)
            
            // startDate가 자정이고 startTime이 다른 시간이면 결합
            if (startDateObj.getHours() === 0 && startDateObj.getMinutes() === 0 && 
                (startTimeObj.getHours() !== 0 || startTimeObj.getMinutes() !== 0)) {
              startDateObj.setHours(startTimeObj.getHours(), startTimeObj.getMinutes(), 
                                   startTimeObj.getSeconds(), startTimeObj.getMilliseconds())
              start = startDateObj
            }
          }
        } else if (event.startTime) {
          // startDate가 없고 startTime만 있는 경우
          start = new Date(event.startTime)
        }

        // endDate와 endTime 결합 로직 (간소화)
        let end = null
        
        if (event.endDate) {
          // endDate가 있으면 우선 사용
          end = new Date(event.endDate)
          
          // endTime이 있고 endDate가 자정(00:00:00)이면 endTime의 시간을 적용
          if (event.endTime) {
            const endDateObj = new Date(event.endDate)
            const endTimeObj = new Date(event.endTime)
            
            // endDate가 자정이고 endTime이 다른 시간이면 결합
            if (endDateObj.getHours() === 0 && endDateObj.getMinutes() === 0 && 
                (endTimeObj.getHours() !== 0 || endTimeObj.getMinutes() !== 0)) {
              endDateObj.setHours(endTimeObj.getHours(), endTimeObj.getMinutes(), 
                                 endTimeObj.getSeconds(), endTimeObj.getMilliseconds())
              end = endDateObj
            }
          }
        } else if (event.endTime) {
          // endDate가 없고 endTime만 있는 경우
          end = new Date(event.endTime)
        }

        // start나 end가 null이면 기본값 설정 (데이터 오류 방지)
        if (!start) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[이벤트 ${event.id}] startDate와 startTime이 모두 없습니다.`)
          }
          start = new Date() // 기본값: 현재 시간
        }
        if (!end) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[이벤트 ${event.id}] endDate와 endTime이 모두 없습니다.`)
          }
          end = new Date(start.getTime() + 24 * 60 * 60 * 1000) // 기본값: start + 1일
        }

        // DB 원본 날짜 저장 (프론트엔드에서 실제 종료일 계산용)
        const originalEndDate = event.endDate ? new Date(event.endDate) : end
        
        return {
          id: event.id,
          title: event.title,
          start: start, // 계산된 start (startDate + startTime 결합)
          end: end, // 계산된 end (endDate + endTime 결합)
          startDate: event.startDate ? new Date(event.startDate) : start, // DB 원본 startDate
          endDate: originalEndDate, // DB 원본 endDate (프론트엔드에서 종료일 계산용)
          startTime: event.startTime,
          endTime: event.endTime,
          eventType: event.eventType,
          description: event.description,
          userId: event.userId,
          userName: event.user.name,
          phone: event.user.teams?.[0]?.phone || null, // 전화번호 추가
          teamId: event.teamId,
          teamName: event.team.name,
        }
      })
      
      // null이나 undefined인 이벤트 제거
      const validEvents = formattedEvents.filter(event => event && event.start && event.end)
      
      if (process.env.NODE_ENV === 'development' && validEvents.length !== formattedEvents.length) {
        console.warn(`[이벤트 필터링] ${formattedEvents.length}개 중 ${validEvents.length}개만 유효합니다.`)
      }

      // Date 객체를 ISO 문자열로 변환하여 JSON 직렬화 문제 방지
      const serializedEvents = validEvents.map(event => ({
        ...event,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
      }))

      res.json(serializedEvents)
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
    // Supabase Pooler 모드 호환성을 위해 findFirst 사용
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: event.teamId,
        userId,
      },
    })

    if (!teamMember) {
      return res.status(403).json({ message: '이 이벤트에 접근할 권한이 없습니다.' })
    }

    // 이전 데이터 호환성: startTime/endTime이 별도로 있는 경우 startDate/endDate와 결합
    let start = event.startDate
    if (event.startTime && !event.startDate) {
      start = event.startTime
    } else if (event.startDate && event.startTime && event.startDate.getTime() !== event.startTime.getTime()) {
      const date = new Date(event.startDate)
      const time = new Date(event.startTime)
      date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds())
      start = date
    } else if (event.startDate) {
      start = event.startDate
    }

    let end = event.endDate
    if (event.endTime && !event.endDate) {
      end = event.endTime
    } else if (event.endDate && event.endTime && event.endDate.getTime() !== event.endTime.getTime()) {
      const date = new Date(event.endDate)
      const time = new Date(event.endTime)
      date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds())
      end = date
    } else if (event.endDate) {
      end = event.endDate
    }

    res.json({
      id: event.id,
      title: event.title,
      start: start,
      end: end,
      startDate: start,
      endDate: end,
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
    body('startDate').custom((value) => {
      // ISO 8601 형식 또는 "YYYY-MM-DDTHH:mm" 형식 허용
      if (!value) return false
      // ISO 8601 형식 또는 날짜+시간 형식 확인
      const isoRegex = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/
      const dateRegex = /^\d{4}-\d{2}-\d{2}/
      return isoRegex.test(value) || dateRegex.test(value)
    }).withMessage('시작일은 유효한 날짜 형식이어야 합니다.'),
    body('endDate').custom((value) => {
      // ISO 8601 형식 또는 "YYYY-MM-DDTHH:mm" 형식 허용
      if (!value) return false
      const isoRegex = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/
      const dateRegex = /^\d{4}-\d{2}-\d{2}/
      return isoRegex.test(value) || dateRegex.test(value)
    }).withMessage('종료일은 유효한 날짜 형식이어야 합니다.'),
    body('eventType').isIn(['VACATION', 'MEETING', 'TRAINING', 'BUSINESS_TRIP', 'OTHER']).withMessage('일정 유형이 올바르지 않습니다.'),
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

      // 관리자가 아닌 경우에만 팀 구성원 확인
      // 관리자는 모든 팀에 일정을 등록할 수 있음
      if (req.user.role !== 'ADMIN') {
        // 일반 사용자: 해당 팀의 구성원인지 확인
        // Supabase Pooler 모드 호환성을 위해 findFirst 사용
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: parseInt(teamId),
            userId,
          },
        })

        if (!teamMember) {
          return res.status(403).json({ message: '해당 팀의 구성원만 일정을 등록할 수 있습니다.' })
        }
      }

      // 날짜 문자열을 로컬 시간대로 파싱 (타임존 오류 방지)
      // PostgreSQL이 UTC로 저장하므로, 로컬 시간을 UTC로 변환하여 저장
      const parseLocalDate = (dateString, timeString = null) => {
        if (!dateString) return null
        
        // 날짜만 있는 경우 (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-').map(Number)
          
          // 시간이 제공된 경우 시간도 파싱
          if (timeString && /^\d{2}:\d{2}$/.test(timeString)) {
            const [hours, minutes] = timeString.split(':').map(Number)
            const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0)
            // UTC 오프셋을 고려하여 UTC로 변환
            const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
            return utcDate
          }
          
          // 시간이 없으면 자정으로 설정
          const localDate = new Date(year, month - 1, day, 0, 0, 0, 0)
          const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
          return utcDate
        }
        
        // 시간이 포함된 경우 그대로 파싱
        return new Date(dateString)
      }

      // startDate와 endDate에 시간이 포함되어 있으면 파싱
      // 형식: "YYYY-MM-DDTHH:mm" 또는 "YYYY-MM-DD HH:mm" 또는 "YYYY-MM-DD"
      // PostgreSQL이 UTC로 저장하므로, 로컬 시간을 UTC로 변환하여 저장
      const parseDateTime = (dateTimeString) => {
        if (!dateTimeString) return null
        
        // ISO 형식 (YYYY-MM-DDTHH:mm) - UTC로 파싱하여 저장
        if (dateTimeString.includes('T')) {
          const parts = dateTimeString.split('T')
          if (parts.length === 2) {
            const [datePart, timePart] = parts
            const [year, month, day] = datePart.split('-').map(Number)
            const [hours, minutes] = timePart.split(':').map(Number)
            // 로컬 시간으로 Date 객체 생성
            const localDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0)
            // UTC 오프셋을 고려하여 UTC로 변환
            // 로컬 시간에서 UTC 오프셋만큼 빼서 UTC 시간으로 만들기
            const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
            return utcDate
          }
        }
        
        // 공백 형식 (YYYY-MM-DD HH:mm)
        if (dateTimeString.includes(' ')) {
          const parts = dateTimeString.split(' ')
          if (parts.length === 2) {
            const [datePart, timePart] = parts
            const [year, month, day] = datePart.split('-').map(Number)
            const [hours, minutes] = timePart.split(':').map(Number)
            // 로컬 시간으로 Date 객체 생성
            const localDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0)
            // UTC 오프셋을 고려하여 UTC로 변환
            const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
            return utcDate
          }
        }
        
        // 날짜만 있는 경우 (YYYY-MM-DD) - 이 경우 시간은 00:00으로 설정
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
          const [year, month, day] = dateTimeString.split('-').map(Number)
          const localDate = new Date(year, month - 1, day, 0, 0, 0, 0)
          const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
          return utcDate
        }
        
        // 기타 형식은 기본 Date 생성자 사용
        return new Date(dateTimeString)
      }

      // startDate와 endDate에 시간이 포함되어 있으면 직접 파싱
      // startTime, endTime이 별도로 전달된 경우 결합 (하위 호환성)
      let parsedStartDate
      let parsedEndDate
      
      if (startDate) {
        if (startTime && /^\d{2}:\d{2}$/.test(startTime)) {
          // startTime이 별도로 전달된 경우 (하위 호환성)
          parsedStartDate = parseLocalDate(startDate, startTime)
        } else {
          // startDate에 시간이 포함된 경우 (예: "2025-12-10T09:00")
          parsedStartDate = parseDateTime(startDate)
        }
      }
      
      if (endDate) {
        if (endTime && /^\d{2}:\d{2}$/.test(endTime)) {
          // endTime이 별도로 전달된 경우 (하위 호환성)
          parsedEndDate = parseLocalDate(endDate, endTime)
        } else {
          // endDate에 시간이 포함된 경우 (예: "2025-12-10T18:00")
          parsedEndDate = parseDateTime(endDate)
        }
      }

      // eventType 대소문자 정리 및 검증
      const normalizedEventType = eventType ? eventType.toUpperCase().trim() : 'OTHER'
      const validEventTypes = ['VACATION', 'MEETING', 'TRAINING', 'BUSINESS_TRIP', 'OTHER']
      if (!validEventTypes.includes(normalizedEventType)) {
        return res.status(400).json({ message: `일정 유형이 올바르지 않습니다. 허용된 값: ${validEventTypes.join(', ')}` })
      }

      const event = await prisma.event.create({
        data: {
          title,
          description,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          startTime: parsedStartDate, // startDate와 동일하게 저장
          endTime: parsedEndDate, // endDate와 동일하게 저장
          eventType: normalizedEventType,
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
    body('startDate').optional().custom((value) => {
      if (!value) return true
      const isoRegex = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/
      const dateRegex = /^\d{4}-\d{2}-\d{2}/
      return isoRegex.test(value) || dateRegex.test(value)
    }).withMessage('시작일은 유효한 날짜 형식이어야 합니다.'),
    body('endDate').optional().custom((value) => {
      if (!value) return true
      const isoRegex = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/
      const dateRegex = /^\d{4}-\d{2}-\d{2}/
      return isoRegex.test(value) || dateRegex.test(value)
    }).withMessage('종료일은 유효한 날짜 형식이어야 합니다.'),
    body('eventType').optional().isIn(['VACATION', 'MEETING', 'TRAINING', 'BUSINESS_TRIP', 'OTHER']).withMessage('일정 유형이 올바르지 않습니다.'),
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

      // 날짜+시간 문자열을 파싱하는 함수
      // PostgreSQL이 UTC로 저장하므로, 로컬 시간을 UTC로 변환하여 저장
      const parseDateTime = (dateTimeString) => {
        if (!dateTimeString) return null
        
        // ISO 형식 (YYYY-MM-DDTHH:mm) - UTC로 파싱하여 저장
        if (dateTimeString.includes('T')) {
          const parts = dateTimeString.split('T')
          if (parts.length === 2) {
            const [datePart, timePart] = parts
            const [year, month, day] = datePart.split('-').map(Number)
            const [hours, minutes] = timePart.split(':').map(Number)
            // 로컬 시간으로 Date 객체 생성
            const localDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0)
            // UTC 오프셋을 고려하여 UTC로 변환
            const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
            return utcDate
          }
        }
        
        // 공백 형식 (YYYY-MM-DD HH:mm)
        if (dateTimeString.includes(' ')) {
          const parts = dateTimeString.split(' ')
          if (parts.length === 2) {
            const [datePart, timePart] = parts
            const [year, month, day] = datePart.split('-').map(Number)
            const [hours, minutes] = timePart.split(':').map(Number)
            // 로컬 시간으로 Date 객체 생성
            const localDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0)
            // UTC 오프셋을 고려하여 UTC로 변환
            const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
            return utcDate
          }
        }
        
        // 날짜만 있는 경우 (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeString)) {
          const [year, month, day] = dateTimeString.split('-').map(Number)
          const localDate = new Date(year, month - 1, day, 0, 0, 0, 0)
          const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
          return utcDate
        }
        
        // 기타 형식은 기본 Date 생성자 사용
        return new Date(dateTimeString)
      }
      
      // 날짜 문자열을 로컬 시간대로 파싱 (하위 호환성)
      const parseLocalDate = (dateString, timeString = null) => {
        if (!dateString) return null
        
        // 날짜만 있는 경우 (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-').map(Number)
          
          // 시간이 제공된 경우 시간도 파싱
          if (timeString && /^\d{2}:\d{2}$/.test(timeString)) {
            const [hours, minutes] = timeString.split(':').map(Number)
            return new Date(year, month - 1, day, hours, minutes, 0, 0)
          }
          
          // 시간이 없으면 자정으로 설정
          return new Date(year, month - 1, day, 0, 0, 0, 0)
        }
        
        // 시간이 포함된 경우 그대로 파싱
        return new Date(dateString)
      }

      // 업데이트 데이터 구성
      const updateData = {}
      if (title) updateData.title = title
      
      // startDate와 endDate에 시간이 포함되어 있으면 직접 파싱
      // startTime, endTime이 별도로 전달된 경우 결합 (하위 호환성)
      if (startDate) {
        if (startTime && /^\d{2}:\d{2}$/.test(startTime)) {
          // startTime이 별도로 전달된 경우
          updateData.startDate = parseLocalDate(startDate, startTime)
        } else {
          // startDate에 시간이 포함된 경우
          updateData.startDate = parseDateTime(startDate)
        }
        // startTime은 startDate와 동일하게 저장
        updateData.startTime = updateData.startDate
      }
      
      if (endDate) {
        if (endTime && /^\d{2}:\d{2}$/.test(endTime)) {
          // endTime이 별도로 전달된 경우
          updateData.endDate = parseLocalDate(endDate, endTime)
        } else {
          // endDate에 시간이 포함된 경우
          updateData.endDate = parseDateTime(endDate)
        }
        // endTime은 endDate와 동일하게 저장
        updateData.endTime = updateData.endDate
      }
      
      // eventType 대소문자 정리 및 검증
      if (eventType) {
        const normalizedEventType = eventType.toUpperCase().trim()
        const validEventTypes = ['VACATION', 'MEETING', 'TRAINING', 'BUSINESS_TRIP', 'OTHER']
        if (!validEventTypes.includes(normalizedEventType)) {
          return res.status(400).json({ message: `일정 유형이 올바르지 않습니다. 허용된 값: ${validEventTypes.join(', ')}` })
        }
        updateData.eventType = normalizedEventType
      }
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

      // 이전 데이터 호환성: startTime/endTime이 별도로 있는 경우 startDate/endDate와 결합
      let start = updatedEvent.startDate
      if (updatedEvent.startTime && !updatedEvent.startDate) {
        start = updatedEvent.startTime
      } else if (updatedEvent.startDate && updatedEvent.startTime && updatedEvent.startDate.getTime() !== updatedEvent.startTime.getTime()) {
        const date = new Date(updatedEvent.startDate)
        const time = new Date(updatedEvent.startTime)
        date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds())
        start = date
      } else if (updatedEvent.startDate) {
        start = updatedEvent.startDate
      }

      let end = updatedEvent.endDate
      if (updatedEvent.endTime && !updatedEvent.endDate) {
        end = updatedEvent.endTime
      } else if (updatedEvent.endDate && updatedEvent.endTime && updatedEvent.endDate.getTime() !== updatedEvent.endTime.getTime()) {
        const date = new Date(updatedEvent.endDate)
        const time = new Date(updatedEvent.endTime)
        date.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds())
        end = date
      } else if (updatedEvent.endDate) {
        end = updatedEvent.endDate
      }

      res.json({
        id: updatedEvent.id,
        title: updatedEvent.title,
        start: start,
        end: end,
        startDate: start,
        endDate: end,
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

