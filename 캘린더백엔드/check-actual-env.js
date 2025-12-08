// 실제 로드된 환경 변수 확인
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 실제 로드된 DATABASE_URL 확인...\n')

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.log('❌ DATABASE_URL이 설정되지 않았습니다')
  console.log('.env 파일에 DATABASE_URL을 추가하세요\n')
  process.exit(1)
}

console.log('현재 DATABASE_URL (처음 50자만 표시):')
console.log(dbUrl.substring(0, 50) + '...\n')

// 형식 분석
if (dbUrl.includes('db.') && dbUrl.includes('.supabase.co:5432')) {
  console.log('❌ 문제 발견: 직접 연결 형식을 사용하고 있습니다')
  console.log('\n현재 형식:', dbUrl.match(/@[^@]+/)?.[0] || '확인 불가')
  console.log('\n✅ 해결 방법:')
  console.log('Supabase 대시보드 → Settings → Database → Connection string')
  console.log('URI 탭 → Session mode 또는 Transaction mode 복사')
  console.log('\n올바른 형식은 다음과 같아야 합니다:')
  console.log('postgresql://postgres.프로젝트ID:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres\n')
} else if (dbUrl.includes('pooler') && dbUrl.includes(':6543')) {
  console.log('✅ Pooler 모드 형식이 올바릅니다!')
  
  // 연결 테스트
  console.log('\n🔗 연결 테스트 중...\n')
  
  import('@prisma/client').then(async ({ PrismaClient }) => {
    const prisma = new PrismaClient()
    
    try {
      await prisma.$connect()
      console.log('✅ 데이터베이스 연결 성공!\n')
      
      // 테이블 확인
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
      
      if (tables.length === 0) {
        console.log('⚠️  테이블이 없습니다.')
        console.log('스키마를 적용해야 합니다:\n')
        console.log('방법 1: Supabase SQL Editor에서 supabase_migration.sql 실행')
        console.log('방법 2: npm run prisma:migrate 실행\n')
      } else {
        console.log(`✅ ${tables.length}개의 테이블이 있습니다:\n`)
        tables.forEach((table, index) => {
          console.log(`  ${index + 1}. ${table.table_name}`)
        })
        
        const expectedTables = ['users', 'teams', 'team_members', 'events']
        const existingTables = tables.map(t => t.table_name)
        const missingTables = expectedTables.filter(t => !existingTables.includes(t))
        
        if (missingTables.length > 0) {
          console.log('\n⚠️  누락된 테이블:')
          missingTables.forEach(table => {
            console.log(`  - ${table}`)
          })
        } else {
          console.log('\n✅ 모든 필요한 테이블이 생성되었습니다!')
        }
        console.log('')
      }
      
    } catch (error) {
      console.log('❌ 연결 실패:', error.message)
      console.log('\n가능한 원인:')
      console.log('  1. 비밀번호가 잘못되었습니다')
      console.log('  2. Supabase 프로젝트가 일시 중지되었습니다')
      console.log('  3. 네트워크 연결 문제')
      console.log('  4. 프로젝트 ID가 잘못되었습니다\n')
    } finally {
      await prisma.$disconnect()
    }
  }).catch(err => {
    console.error('Prisma 클라이언트 로드 오류:', err.message)
  })
  
} else {
  console.log('⚠️  알 수 없는 DATABASE_URL 형식입니다')
  console.log('Supabase 연결 문자열 형식을 확인하세요\n')
}

