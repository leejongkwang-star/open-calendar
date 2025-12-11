// 브라우저 콘솔에서 실행할 수 있는 API 테스트 코드
// F12 → Console 탭에서 복사하여 실행하세요

// 1. 먼저 로그인 토큰 확인
const authStorage = localStorage.getItem('auth-storage')
console.log('Auth Storage:', authStorage)

// 2. 토큰 추출
let token = null
try {
  const authData = JSON.parse(authStorage || '{}')
  token = authData?.state?.token
  console.log('Token:', token ? '있음' : '없음')
} catch (e) {
  console.error('토큰 파싱 오류:', e)
}

// 3. API 호출
if (token) {
  fetch('http://localhost:3001/api/events', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Response Status:', response.status)
    console.log('Response Headers:', [...response.headers.entries()])
    return response.json()
  })
  .then(data => {
    console.log('=== 이벤트 응답 ===')
    console.log('받은 이벤트 개수:', data.length)
    console.log('모든 이벤트:', data)
    console.log('이벤트 목록:')
    data.forEach((event, index) => {
      console.log(`[${index + 1}] ID: ${event.id}, 제목: ${event.title}, 시작: ${event.start}, 종료: ${event.end}`)
    })
  })
  .catch(error => {
    console.error('API 호출 오류:', error)
  })
} else {
  console.error('토큰이 없습니다. 먼저 로그인해주세요.')
}

