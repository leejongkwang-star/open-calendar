// DATABASE_URL 형식 상세 분석 및 수정 가이드
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 DATABASE_URL 형식 상세 분석\n')

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.log('❌ DATABASE_URL이 설정되지 않았습니다\n')
  process.exit(1)
}

console.log('현재 DATABASE_URL:')
console.log(dbUrl)
console.log('')

// URL 파싱
try {
  const url = new URL(dbUrl.replace(/^postgres:\/\//, 'postgresql://'))
  
  console.log('📋 연결 정보 분석:')
  console.log(`  프로토콜: ${url.protocol}`)
  console.log(`  사용자명: ${url.username}`)
  console.log(`  호스트: ${url.hostname}`)
  console.log(`  포트: ${url.port}`)
  console.log(`  데이터베이스: ${url.pathname.substring(1)}`)
  console.log('')

  // 문제점 분석
  const issues = []
  
  if (dbUrl.startsWith('postgres://')) {
    issues.push('⚠️  "postgres://" → "postgresql://"로 변경 필요')
  }
  
  if (url.hostname.includes('db.') && url.hostname.includes('.supabase.co')) {
    issues.push('❌ 직접 연결 형식 사용 중 - Pooler 모드로 변경 필요')
    issues.push('   현재: db.xxx.supabase.co')
    issues.push('   변경: aws-0-ap-northeast-2.pooler.supabase.com')
  }
  
  if (!url.hostname.includes('pooler') && url.port === '6543') {
    issues.push('⚠️  포트 6543 사용 중이지만 Pooler 호스트가 아님')
  }
  
  if (!url.password) {
    issues.push('❌ 비밀번호가 없습니다!')
  }
  
  if (url.username === 'postgres.cbZ4ySUyfb5f3K7F' || url.username.includes('cbZ4ySUyfb5f3K7F')) {
    issues.push('❌ 프로젝트 ID와 비밀번호가 섞여있습니다!')
  }

  if (issues.length > 0) {
    console.log('🚨 발견된 문제점:\n')
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`)
    })
    console.log('')
  } else {
    console.log('✅ 형식이 올바릅니다!\n')
  }

  // 올바른 형식 예시
  console.log('✅ 올바른 형식 예시:\n')
  console.log('Pooler 모드 (권장):')
  console.log('DATABASE_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"\n')
  
  console.log('구조 설명:')
  console.log('  - postgresql://  → 프로토콜')
  console.log('  - postgres.      → 사용자명 (프로젝트 ID 앞에 점 추가)')
  console.log('  - 프로젝트ID      → Supabase 프로젝트 참조 ID')
  console.log('  - :비밀번호      → 콜론(:) 뒤에 데이터베이스 비밀번호')
  console.log('  - @aws-0-...     → Pooler 호스트 (db.xxx 형식 아님)')
  console.log('  - :6543          → Pooler 포트')
  console.log('  - /postgres      → 데이터베이스 이름\n')

  console.log('📖 Supabase에서 올바른 연결 문자열 가져오는 방법:\n')
  console.log('1. Supabase 대시보드 접속')
  console.log('2. 왼쪽 사이드바 → Settings (⚙️)')
  console.log('3. Database 메뉴 클릭')
  console.log('4. 페이지 아래로 스크롤 → Connection string 섹션')
  console.log('5. URI 탭 선택')
  console.log('6. Session mode 또는 Transaction mode 연결 문자열 복사')
  console.log('7. .env 파일에 붙여넣기\n')

} catch (error) {
  console.error('URL 파싱 오류:', error.message)
}

