// 팀 목록 API 테스트 스크립트
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const API_BASE_URL = 'http://localhost:3001/api'

async function testTeamsAPI() {
  try {
    console.log('🔍 팀 목록 API 테스트\n')
    
    // 먼저 로그인해서 토큰 받기
    console.log('1. 로그인 중...')
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      employeeNumber: 'ADM001',
      password: 'admin123',
    })
    
    const token = loginResponse.data.token
    console.log('✅ 로그인 성공\n')
    
    // 팀 목록 조회
    console.log('2. 팀 목록 조회 중...')
    const teamsResponse = await axios.get(`${API_BASE_URL}/teams`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    
    console.log('✅ 팀 목록 조회 성공:')
    console.log(JSON.stringify(teamsResponse.data, null, 2))
    
  } catch (error) {
    console.error('❌ 오류 발생:')
    if (error.response) {
      console.error('상태 코드:', error.response.status)
      console.error('에러 메시지:', error.response.data)
    } else {
      console.error('에러:', error.message)
    }
  }
}

testTeamsAPI()

