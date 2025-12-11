# 인증 오류 디버깅 가이드

## 문제
이벤트 등록 시 "인증 처리 중 오류가 발생했습니다" 오류가 발생합니다.

## 해결 방법

### 1. 브라우저 콘솔 확인
1. 브라우저에서 F12 키를 눌러 개발자 도구 열기
2. Console 탭 확인
3. 오류 메시지 확인

### 2. 네트워크 탭 확인
1. 개발자 도구의 Network 탭 열기
2. 이벤트 등록 시도
3. `/api/events` 요청 확인
4. Request Headers에서 `Authorization: Bearer ...` 확인
5. Response에서 오류 메시지 확인

### 3. 토큰 확인
브라우저 콘솔에서 다음 명령 실행:
```javascript
// 토큰 확인
const authStorage = localStorage.getItem('auth-storage')
console.log('Auth Storage:', JSON.parse(authStorage))
```

### 4. 백엔드 서버 로그 확인
백엔드 서버 터미널에서 오류 메시지 확인

### 5. JWT_SECRET 확인
`캘린더백엔드/.env` 파일에 다음이 있는지 확인:
```env
JWT_SECRET="your-secret-key"
```

### 6. 로그아웃 후 재로그인
1. 로그아웃
2. 다시 로그인
3. 새 토큰으로 이벤트 등록 시도

## 일반적인 원인

1. **토큰이 없음**: 로그인하지 않았거나 토큰이 만료됨
2. **JWT_SECRET 불일치**: 백엔드와 프론트엔드의 JWT_SECRET이 다름
3. **토큰 형식 오류**: Authorization 헤더 형식이 잘못됨
4. **CORS 문제**: 프론트엔드에서 백엔드로 요청이 차단됨

## 수정된 내용

1. 토큰 파싱 로직 개선 (Zustand persist 형식 지원)
2. JWT_SECRET 검증 추가
3. 개발 환경에서 상세 에러 메시지 표시
4. 이벤트 저장 에러 처리 개선

