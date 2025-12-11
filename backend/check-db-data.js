// 데이터베이스의 실제 데이터 확인 스크립트
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 데이터베이스 실제 데이터 확인\n')
    
    await prisma.$connect()
    console.log('✅ 데이터베이스 연결 성공!\n')
    
    // 사용자 목록
    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log(`📊 사용자 목록 (총 ${users.length}명):\n`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.employeeNumber})`)
      console.log(`   - 권한: ${user.role}`)
      console.log(`   - 상태: ${user.status}`)
      console.log(`   - 가입일: ${user.createdAt.toLocaleString('ko-KR')}`)
      console.log('')
    })
    
    // 팀 목록
    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log(`\n📊 팀 목록 (총 ${teams.length}개):\n`)
    teams.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name}`)
      console.log(`   - 설명: ${team.description || '-'}`)
      console.log(`   - 구성원 수: ${team._count.members}명`)
      console.log(`   - 생성일: ${team.createdAt.toLocaleString('ko-KR')}`)
      console.log('')
    })
    
    // 팀별 구성원
    for (const team of teams) {
      const members = await prisma.teamMember.findMany({
        where: { teamId: team.id },
        include: {
          user: {
            select: {
              name: true,
              employeeNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
      
      if (members.length > 0) {
        console.log(`\n👥 ${team.name} 구성원 (${members.length}명):`)
        members.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.user.name} (${member.user.employeeNumber})`)
          console.log(`      - 직책: ${member.position || '-'}`)
          console.log(`      - 권한: ${member.role}`)
        })
      }
    }
    
    console.log('\n✅ 데이터 확인 완료!\n')
    
  } catch (error) {
    console.error('❌ 오류 발생:')
    console.error('  ', error.message)
    
    if (error.message.includes('prepared statement')) {
      console.error('\n⚠️  Pooler 모드에서 Prisma 쿼리 오류가 발생했습니다.')
      console.error('Supabase SQL Editor에서 직접 확인하세요.\n')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkData()

