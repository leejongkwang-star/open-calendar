import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function checkEvents() {
  try {
    console.log('=== 데이터베이스 이벤트 조회 ===\n')
    
    // 모든 이벤트 조회
    const allEvents = await prisma.event.findMany({
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
    
    console.log(`총 ${allEvents.length}개의 이벤트가 있습니다.\n`)
    
    if (allEvents.length === 0) {
      console.log('⚠️ 데이터베이스에 이벤트가 없습니다.')
      return
    }
    
    console.log('이벤트 목록:')
    allEvents.forEach((event, index) => {
      console.log(`\n[${index + 1}] ID: ${event.id}`)
      console.log(`  제목: ${event.title}`)
      console.log(`  시작일: ${event.startDate}`)
      console.log(`  종료일: ${event.endDate}`)
      console.log(`  시작시간: ${event.startTime}`)
      console.log(`  종료시간: ${event.endTime}`)
      console.log(`  유형: ${event.eventType}`)
      console.log(`  사용자: ${event.user.name} (${event.user.employeeNumber})`)
      console.log(`  팀: ${event.team.name} (ID: ${event.teamId})`)
      console.log(`  생성일: ${event.createdAt}`)
    })
    
    // 날짜별 분석
    console.log('\n\n=== 날짜 분석 ===')
    const now = new Date()
    const pastEvents = allEvents.filter(e => new Date(e.startDate) < now)
    const futureEvents = allEvents.filter(e => new Date(e.startDate) >= now)
    
    console.log(`과거 이벤트: ${pastEvents.length}개`)
    console.log(`현재/미래 이벤트: ${futureEvents.length}개`)
    
    // startDate와 startTime 비교
    console.log('\n\n=== startDate/startTime 분석 ===')
    allEvents.forEach((event) => {
      const hasStartDate = !!event.startDate
      const hasStartTime = !!event.startTime
      const hasEndDate = !!event.endDate
      const hasEndTime = !!event.endTime
      
      console.log(`\n이벤트 ${event.id} (${event.title}):`)
      console.log(`  startDate: ${hasStartDate ? '있음' : '없음'} - ${event.startDate}`)
      console.log(`  startTime: ${hasStartTime ? '있음' : '없음'} - ${event.startTime}`)
      console.log(`  endDate: ${hasEndDate ? '있음' : '없음'} - ${event.endDate}`)
      console.log(`  endTime: ${hasEndTime ? '있음' : '없음'} - ${event.endTime}`)
      
      if (hasStartDate && hasStartTime) {
        const startDate = new Date(event.startDate)
        const startTime = new Date(event.startTime)
        const sameTime = startDate.getTime() === startTime.getTime()
        console.log(`  startDate와 startTime이 ${sameTime ? '동일' : '다름'}`)
      }
      
      if (hasEndDate && hasEndTime) {
        const endDate = new Date(event.endDate)
        const endTime = new Date(event.endTime)
        const sameTime = endDate.getTime() === endTime.getTime()
        console.log(`  endDate와 endTime이 ${sameTime ? '동일' : '다름'}`)
      }
    })
    
  } catch (error) {
    console.error('오류 발생:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEvents()
