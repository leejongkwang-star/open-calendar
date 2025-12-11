# 빠른 시작 가이드

## 🚀 프로젝트 실행 방법

### 1단계: 의존성 설치

**PowerShell 실행 정책 문제가 있는 경우:**

**옵션 A: CMD 사용 (권장)**
```cmd
cd "C:\Users\blood\OneDrive\문서\Cursor\open-calendar-app\캘린더프론트엔드"
npm install
```

**옵션 B: PowerShell 실행 정책 변경**
```powershell
# 관리자 권한으로 PowerShell 실행 후
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
cd "C:\Users\blood\OneDrive\문서\Cursor\open-calendar-app\캘린더프론트엔드"
npm install
```

**옵션 C: VS Code 터미널 사용**
- VS Code에서 프로젝트 열기
- 터미널 열기 (Ctrl + `)
- 다음 명령 실행:
```bash
npm install
```

### 2단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 자동으로 `http://localhost:3000`이 열립니다.

## 🧪 테스트 방법

### 로그인 테스트

백엔드 없이도 테스트할 수 있습니다! 다음 계정으로 로그인하세요:

- **관리자 계정**: 직원번호 `ADM001` (비밀번호: 아무 값)
- **일반 사용자**: 직원번호 `USR001` (비밀번호: 아무 값)

### 테스트할 수 있는 기능

✅ **로그인 화면**
- 직원번호 형식 검증 (6자리 영문+숫자 조합)
- 필수 필드 검증
- 로그인 성공/실패 처리

✅ **캘린더 화면**
- 월/주/일 뷰 전환
- 일정 추가/수정/삭제
- 일정 필터링
- 구성원별 색상 구분

✅ **관리자 화면** (관리자 계정으로 로그인 시)
- 팀 생성/수정/삭제
- 구성원 추가/수정/삭제
- 관리자 권한 부여/변경
- 검색 및 필터링

## 📝 참고사항

- 모든 데이터는 **로컬 스토리지**에 저장됩니다
- 브라우저를 새로고침해도 데이터가 유지됩니다
- 실제 백엔드 API를 연결하려면 `.env` 파일을 생성하고 `VITE_API_BASE_URL`을 설정하세요

## 🔧 문제 해결

### 포트가 이미 사용 중인 경우
`vite.config.js`에서 포트를 변경하세요:
```js
server: {
  port: 3001, // 다른 포트 사용
}
```

### 모듈을 찾을 수 없는 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### 빌드 오류
```bash
# 캐시 삭제 후 재시도
npm run build -- --force
```

