// 인증 정보 확인 (비밀번호는 일부만 표시)
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 연결 정보 확인 (보안을 위해 일부만 표시)\n')

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.log('❌ DATABASE_URL이 설정되지 않았습니다\n')
  process.exit(1)
}

try {
  const url = new URL(dbUrl.replace(/^postgres:\/\//, 'postgresql://'))
  
  console.log('📋 현재 설정:')
  console.log(`  프로토콜: ${url.protocol}`)
  console.log(`  사용자명: ${url.username}`)
  console.log(`  호스트: ${url.hostname}`)
  console.log(`  포트: ${url.port}`)
  console.log(`  비밀번호 길이: ${url.password ? url.password.length : 0}자`)
  if (url.password) {
    // 비밀번호의 처음 4자와 마지막 4자만 표시
    const pwd = url.password
    if (pwd.length > 8) {
      console.log(`  비밀번호 (일부): ${pwd.substring(0, 4)}...${pwd.substring(pwd.length - 4)}`)
    } else {
      console.log(`  비밀번호: ****`)
    }
  }
  console.log(`  데이터베이스: ${url.pathname.substring(1)}`)
  console.log('')

  // 프로젝트 ID 추출
  const username = url.username
  if (username.startsWith('postgres.')) {
    const projectId = username.substring(9) // 'postgres.' 제거
    console.log(`✅ 프로젝트 ID: ${projectId}\n`)
  }

  // 비밀번호 중복 확인
  if (url.password) {
    const pwd = url.password
    const halfLength = Math.floor(pwd.length / 2)
    const firstHalf = pwd.substring(0, halfLength)
    const secondHalf = pwd.substring(halfLength)
    
    if (firstHalf === secondHalf && pwd.length > 10) {
      console.log('⚠️  비밀번호가 중복된 것 같습니다!')
      console.log(`  현재: ${pwd.length}자 (중복 의심)`)
      console.log(`  예상 정상 길이: ${halfLength}자\n`)
    }
  }

  console.log('🔧 해결 방법:\n')
  console.log('1. Supabase 대시보드 → Settings → Database')
  console.log('2. "Reset database password" 또는 "Connection string" 확인')
  console.log('3. 올바른 비밀번호를 .env 파일에 입력\n')
  
  console.log('💡 비밀번호를 잊어버렸다면:')
  console.log('   Supabase → Settings → Database → Reset database password\n')
  
  console.log('📝 올바른 형식 확인:')
  console.log('   DATABASE_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"\n')

} catch (error) {
  console.error('오류:', error.message)
}

