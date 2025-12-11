# 직원번호 중복 확인 오류 해결 가이드

## 🔴 오류 메시지
"직원번호 확인 중 오류가 발생했습니다. 다시 시도해주세요."

## 🔍 원인 분석

이 오류는 `checkEmployeeNumberAvailability` 함수의 `catch` 블록에서 발생합니다. 가능한 원인:

### 1. 백엔드 서버가 실행되지 않음 (가장 가능성 높음)
- 백엔드 API (`http://localhost:3001/api/auth/check-employee-number`)에 연결할 수 없음
- 이전에 `ERR_CONNECTION_REFUSED` 오류가 발생했던 것과 같은 원인

### 2. 환경 변수 설정 문제
- `VITE_API_BASE_URL`이 설정되지 않았거나 잘못됨
- 기본값 `http://localhost:3001/api`를 사용 중인데 백엔드가 다른 포트에서 실행 중

### 3. 네트워크/CORS 문제
- 백엔드 CORS 설정 문제
- 방화벽 또는 프록시 설정

## ✅ 해결 방법

### 방법 1: 백엔드 서버 시작 확인 (우선 확인)

1. **백엔드 서버가 실행 중인지 확인**
   ```powershell
   # 새 터미널에서
   cd backend
   npm run dev
   ```

2. **브라우저에서 직접 테스트**
   ```
   http://localhost:3001/api/auth/check-employee-number?employeeNumber=A99120
   ```
   - 정상: JSON 응답 (`{"exists":true}` 또는 `{"exists":false}`)
   - 오류: 연결 불가 또는 오류 메시지

### 방법 2: Mock 모드 사용 (임시 해결)

백엔드 서버 없이 테스트하려면:

**frontend/.env 파일 생성:**
```env
VITE_USE_MOCK=true
```

또는 `VITE_API_BASE_URL`을 비워두면 자동으로 Mock 모드로 전환됩니다.

### 방법 3: 환경 변수 확인

**frontend/.env 파일 확인:**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

백엔드가 다른 포트에서 실행 중이면 포트 번호를 맞춰주세요.

## 🔧 즉시 확인 사항

### 체크리스트
- [ ] 백엔드 서버가 포트 3001에서 실행 중인가?
- [ ] 브라우저 콘솔(F12)에 네트워크 오류가 있는가?
- [ ] `http://localhost:3001/api/auth/check-employee-number?employeeNumber=A99120` 직접 접속 시 응답이 오는가?
- [ ] 프론트엔드 서버가 실행 중인가?

## 📝 디버깅 방법

### 1. 브라우저 콘솔 확인 (F12)
```javascript
// Console 탭에서 확인
// 네트워크 오류가 있는지 확인
```

### 2. Network 탭 확인
- F12 → Network 탭
- 직원번호 입력 후 확인
- `/auth/check-employee-number` 요청 상태 확인
  - 200: 정상
  - 404: 엔드포인트 없음
  - ERR_CONNECTION_REFUSED: 서버 미실행
  - CORS 오류: CORS 설정 문제

### 3. 코드에서 로깅 추가 (선택사항)

`frontend/src/pages/SignupPage.jsx`의 `catch` 블록:
```javascript
catch (error) {
  console.error('직원번호 확인 실패:', error)
  console.error('Error details:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    url: error.config?.url
  })
  // ...
}
```

## 💡 빠른 해결책

1. **START_SERVERS.bat 파일 실행** (프로젝트 루트)
   - 백엔드와 프론트엔드 서버 모두 자동 시작

2. **또는 수동으로 두 터미널에서:**
   ```powershell
   # 터미널 1
   cd backend
   npm run dev
   
   # 터미널 2
   cd frontend
   npm run dev
   ```

3. **브라우저 새로고침**

## 🚨 계속 문제가 발생하면

1. 백엔드 서버 로그 확인
2. 프론트엔드 콘솔 오류 확인
3. Network 탭에서 실제 요청/응답 확인
4. `.env` 파일 설정 확인

---

**가장 가능성 높은 원인: 백엔드 서버가 실행되지 않음**

먼저 백엔드 서버가 정상 실행 중인지 확인하세요!

