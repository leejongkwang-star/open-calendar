// 데이터베이스 연결 및 테이블 확인 스크립트
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 데이터베이스 연결 확인 중...\n')
    
    // 1. 연결 테스트
    await prisma.$connect()
    console.log('✅ 데이터베이스 연결 성공!\n')
    
    // 2. 테이블 목록 확인 (SQL 쿼리)
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    
    console.log('📊 생성된 테이블 목록:')
    if (tables.length === 0) {
      console.log('  ⚠️  테이블이 없습니다. 스키마를 적용해야 합니다.\n')
    } else {
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.table_name}`)
      })
      console.log(`\n총 ${tables.length}개의 테이블이 있습니다.\n`)
    }
    
    // 3. 예상 테이블 확인
    const expectedTables = ['users', 'teams', 'team_members', 'events']
    const existingTables = tables.map(t => t.table_name)
    const missingTables = expectedTables.filter(t => !existingTables.includes(t))
    
    if (missingTables.length > 0) {
      console.log('⚠️  누락된 테이블:')
      missingTables.forEach(table => {
        console.log(`  - ${table}`)
      })
      console.log('\n💡 해결 방법: supabase_migration.sql 파일을 Supabase SQL Editor에서 실행하세요.\n')
    } else {
      console.log('✅ 모든 필요한 테이블이 생성되었습니다!\n')
    }
    
    // 4. 각 테이블의 데이터 개수 확인
    if (existingTables.length > 0) {
      console.log('📈 테이블별 데이터 개수:')
      for (const table of existingTables) {
        try {
          const count = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM "${table}"`
          )
          console.log(`  - ${table}: ${count[0].count}개`)
        } catch (err) {
          console.log(`  - ${table}: 확인 불가 (${err.message})`)
        }
      }
      console.log('')
    }
    
    // 5. Enum 타입 확인
    try {
      const enums = await prisma.$queryRaw`
        SELECT typname as enum_name
        FROM pg_type 
        WHERE typtype = 'e'
        ORDER BY typname;
      `
      if (enums.length > 0) {
        console.log('📋 생성된 Enum 타입:')
        enums.forEach((e, index) => {
          console.log(`  ${index + 1}. ${e.enum_name}`)
        })
        console.log('')
      }
    } catch (err) {
      console.log('⚠️  Enum 타입 확인 중 오류:', err.message)
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 확인 실패:')
    console.error('  오류:', error.message)
    
    if (error.message.includes('Connection')) {
      console.error('\n💡 가능한 원인:')
      console.error('  1. DATABASE_URL이 올바르게 설정되지 않았습니다.')
      console.error('  2. Supabase 프로젝트가 실행되지 않았습니다.')
      console.error('  3. 네트워크 연결 문제가 있습니다.')
      console.error('\n  .env 파일의 DATABASE_URL을 확인하세요.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

