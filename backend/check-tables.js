// 테이블 상세 확인 스크립트
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function checkTables() {
  try {
    console.log('🔍 데이터베이스 테이블 상세 확인\n')
    
    await prisma.$connect()
    console.log('✅ 데이터베이스 연결 성공!\n')
    
    // 테이블 목록 조회
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
    
    if (tables.length === 0) {
      console.log('❌ 테이블이 없습니다.')
      console.log('Supabase SQL Editor에서 supabase_migration.sql을 실행하세요.\n')
      return
    }
    
    console.log(`✅ 총 ${tables.length}개의 테이블이 있습니다:\n`)
    
    const expectedTables = ['users', 'teams', 'team_members', 'events']
    const existingTables = tables.map(t => t.table_name)
    
    // 예상 테이블 확인
    console.log('📊 테이블 목록:')
    existingTables.forEach((table, index) => {
      const isExpected = expectedTables.includes(table)
      const icon = isExpected ? '✅' : 'ℹ️'
      console.log(`  ${index + 1}. ${icon} ${table}`)
    })
    console.log('')
    
    // 누락된 테이블 확인
    const missingTables = expectedTables.filter(t => !existingTables.includes(t))
    if (missingTables.length > 0) {
      console.log('⚠️  누락된 테이블:')
      missingTables.forEach(table => {
        console.log(`  - ${table}`)
      })
      console.log('')
    } else {
      console.log('✅ 모든 필요한 테이블이 생성되었습니다!\n')
    }
    
    // 각 테이블의 컬럼 정보 확인
    console.log('📋 테이블별 컬럼 정보:\n')
    for (const table of existingTables) {
      try {
        const columns = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position;
        `, table)
        
        console.log(`📌 ${table}:`)
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(not null)'
          console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`)
        })
        console.log('')
      } catch (err) {
        console.log(`   ⚠️  컬럼 정보 확인 실패: ${err.message}\n`)
      }
    }
    
    // 각 테이블의 데이터 개수 확인
    console.log('📈 테이블별 데이터 개수:\n')
    for (const table of existingTables) {
      try {
        const count = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${table}"`
        )
        const countNum = parseInt(count[0].count)
        console.log(`  ${table}: ${countNum}개`)
      } catch (err) {
        console.log(`  ${table}: 확인 불가 (${err.message})`)
      }
    }
    console.log('')
    
    // Enum 타입 확인
    try {
      const enums = await prisma.$queryRaw`
        SELECT typname as enum_name
        FROM pg_type 
        WHERE typtype = 'e'
        ORDER BY typname;
      `
      if (enums.length > 0) {
        console.log('📋 Enum 타입:')
        enums.forEach((e, index) => {
          console.log(`  ${index + 1}. ${e.enum_name}`)
        })
        console.log('')
      }
    } catch (err) {
      // Enum이 없어도 괜찮음 (CHECK 제약조건 사용)
    }
    
    // 인덱스 확인
    try {
      const indexes = await prisma.$queryRaw`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `
      if (indexes.length > 0) {
        console.log('🔍 생성된 인덱스:')
        const indexMap = new Map()
        indexes.forEach(idx => {
          if (!indexMap.has(idx.tablename)) {
            indexMap.set(idx.tablename, [])
          }
          indexMap.get(idx.tablename).push(idx.indexname)
        })
        
        indexMap.forEach((indexNames, tableName) => {
          console.log(`  ${tableName}:`)
          indexNames.forEach(name => {
            console.log(`    - ${name}`)
          })
        })
        console.log('')
      }
    } catch (err) {
      console.log('⚠️  인덱스 확인 실패\n')
    }
    
    console.log('✅ 데이터베이스 스키마 확인 완료!\n')
    console.log('다음 단계:')
    if (existingTables.includes('users')) {
      console.log('  - 초기 데이터 생성: npm run prisma:seed')
    }
    console.log('  - 서버 실행: npm run dev\n')
    
  } catch (error) {
    console.error('❌ 오류 발생:')
    console.error('  ', error.message)
    
    if (error.message.includes('prepared statement')) {
      console.error('\n⚠️  Pooler 모드에서 Prisma 쿼리 오류가 발생했습니다.')
      console.error('Supabase SQL Editor에서 직접 확인하거나')
      console.error('Prisma Studio를 사용하세요: npm run prisma:studio\n')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()

