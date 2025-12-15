import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncUserTeamRoles() {
  console.log('=== 사용자 전역 권한과 팀 권한 동기화 시작 ===')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      employeeNumber: true,
      role: true,
    },
  })

  let updatedMembersCount = 0

  for (const user of users) {
    const result = await prisma.teamMember.updateMany({
      where: { userId: user.id },
      data: { role: user.role },
    })

    if (result.count > 0) {
      updatedMembersCount += result.count
      console.log(
        `사용자 ${user.name}(${user.employeeNumber}) - 팀 구성원 ${result.count}건을 ${user.role}로 동기화`,
      )
    }
  }

  console.log('=== 동기화 완료 ===')
  console.log(`총 업데이트된 teamMember 레코드 수: ${updatedMembersCount}`)
}

syncUserTeamRoles()
  .catch((err) => {
    console.error('역할 동기화 중 오류 발생:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


