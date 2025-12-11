// .env 파일의 DATABASE_URL 형식 확인
import dotenv from 'dotenv'
import fs from 'fs'

console.log('🔍 .env 파일 확인 중...\n')

try {
  const envContent = fs.readFileSync('.env', 'utf-8')
  const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/i)
  
  if (dbUrlMatch) {
    const dbUrl = dbUrlMatch[1]
    console.log('현재 DATABASE_URL:')
    console.log(dbUrl)
    console.log('')
    
    // 형식 확인
    if (dbUrl.includes(':5432') && !dbUrl.includes('pooler')) {
      console.log('⚠️  문제 발견:')
      console.log('  - 직접 연결 방식(포트 5432)을 사용하고 있습니다')
      console.log('  - Supabase의 직접 연결은 IP 제한이 있을 수 있습니다\n')
      console.log('✅ 해결 방법:')
      console.log('  Pooler 모드(포트 6543)를 사용하세요\n')
      console.log('올바른 형식 예시:')
      console.log('DATABASE_URL="postgresql://postgres.프로젝트ID:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"\n')
    } else if (dbUrl.includes('pooler') && dbUrl.includes(':6543')) {
      console.log('✅ Pooler 모드(포트 6543)를 사용 중입니다 - 올바른 형식입니다!')
      console.log('그런데도 연결이 안 되면:')
      console.log('  1. Supabase 프로젝트가 활성화되어 있는지 확인')
      console.log('  2. 비밀번호가 정확한지 확인')
      console.log('  3. 네트워크 연결 확인\n')
    } else if (dbUrl.includes('db.') && dbUrl.includes('.supabase.co')) {
      console.log('⚠️  문제 발견:')
      console.log('  - 직접 연결 형식(db.xxx.supabase.co)을 사용하고 있습니다')
      console.log('  - Pooler 모드로 변경하세요\n')
    }
    
    // 프로젝트 ID 추출
    const projectIdMatch = dbUrl.match(/postgres[.:]([^.]+)/)
    if (projectIdMatch) {
      console.log(`프로젝트 ID: ${projectIdMatch[1]}\n`)
    }
    
    // 비밀번호 확인
    const passwordMatch = dbUrl.match(/:[^:@]+@/)
    if (passwordMatch) {
      const password = passwordMatch[0].slice(1, -1)
      if (password.length < 8) {
        console.log('⚠️  비밀번호가 너무 짧습니다 (8자 이상 권장)')
      } else {
        console.log(`✅ 비밀번호 길이: ${password.length}자`)
      }
    }
    
  } else {
    console.log('❌ DATABASE_URL을 찾을 수 없습니다')
    console.log('.env 파일에 DATABASE_URL이 설정되어 있는지 확인하세요')
  }
  
} catch (error) {
  console.error('오류:', error.message)
  if (error.code === 'ENOENT') {
    console.error('\n.env 파일이 없습니다!')
    console.error('env.example.txt를 복사하여 .env 파일을 생성하세요')
  }
}

console.log('\n📖 자세한 가이드: SUPABASE_CONNECTION_CHECK.md 참조')

