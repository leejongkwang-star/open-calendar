import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('시드 데이터 생성 시작...')

  // 관리자 계정 생성
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { employeeNumber: 'ADM001' },
    update: {},
    create: {
      employeeNumber: 'ADM001',
      password: adminPassword,
      name: '관리자',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  })

  console.log('관리자 계정 생성:', admin.employeeNumber)

  // 일반 사용자 계정 생성
  const userPassword = await bcrypt.hash('user123', 10)
  const user = await prisma.user.upsert({
    where: { employeeNumber: 'USR001' },
    update: {},
    create: {
      employeeNumber: 'USR001',
      password: userPassword,
      name: '일반 사용자',
      role: 'MEMBER',
      status: 'APPROVED',
    },
  })

  console.log('일반 사용자 계정 생성:', user.employeeNumber)

  // 팀 생성
  const team = await prisma.team.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '개발팀',
      description: '개발 관련 업무',
      createdBy: admin.id,
    },
  })

  console.log('팀 생성:', team.name)

  // 구성원 추가
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: admin.id,
      position: '팀장',
      role: 'ADMIN',
    },
  })

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      teamId: team.id,
      userId: user.id,
      position: '개발자',
      role: 'MEMBER',
    },
  })

  console.log('구성원 추가 완료')

  // 샘플 이벤트 생성
  const event = await prisma.event.create({
    data: {
      title: '연차',
      description: '연차 사용',
      startDate: new Date(2024, 11, 15),
      endDate: new Date(2024, 11, 16),
      eventType: 'VACATION',
      userId: admin.id,
      teamId: team.id,
    },
  })

  console.log('샘플 이벤트 생성:', event.title)

  console.log('시드 데이터 생성 완료!')
  console.log('\n테스트 계정:')
  console.log('관리자 - 직원번호: ADM001, 비밀번호: admin123')
  console.log('일반 사용자 - 직원번호: USR001, 비밀번호: user123')
}

main()
  .catch((e) => {
    console.error('시드 데이터 생성 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

