# 테스트 가이드

## 1. 프로젝트 실행 방법

### PowerShell 실행 정책 문제 해결

PowerShell에서 스크립트 실행이 차단된 경우, 다음 중 하나를 선택하세요:

**방법 1: 관리자 권한으로 PowerShell 실행**
```powershell
# 관리자 권한으로 PowerShell을 열고 실행
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**방법 2: CMD 사용**
- Windows 키 + R → `cmd` 입력 → Enter
- 다음 명령 실행:
```cmd
cd "C:\Users\blood\OneDrive\문서\Cursor\open-calendar-app\캘린더프론트엔드"
npm install
npm run dev
```

**방법 3: VS Code 터미널 사용**
- VS Code에서 프로젝트 열기
- 터미널 열기 (Ctrl + `)
- 다음 명령 실행:
```bash
npm install
npm run dev
```

## 2. 프로젝트 실행 단계

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev
```

서버가 실행되면 브라우저에서 `http://localhost:3000`으로 접속하세요.

## 3. 테스트 계정 (더미 데이터)

백엔드가 없어도 테스트할 수 있도록 로컬 스토리지를 사용합니다.

### 로그인 테스트
- 직원번호: `ADM001` (관리자) 또는 `USR001` (일반 사용자)
- 비밀번호: 아무 값이나 입력 (검증만 수행)
- 직원번호 형식: 6자리 영문과 숫자 조합 (예: A1B2C3)

### 더미 데이터
- 로그인 후 자동으로 더미 데이터가 생성됩니다
- 캘린더에 샘플 일정이 표시됩니다
- 관리자 페이지에 샘플 팀과 구성원이 표시됩니다

## 4. 주요 기능 테스트

### 로그인 화면
- ✅ 직원번호 형식 검증 (6자리 영문+숫자 조합)
- ✅ 필수 필드 검증
- ✅ 로그인 버튼 활성화/비활성화

### 캘린더 화면
- ✅ 월/주/일 뷰 전환
- ✅ 일정 클릭하여 상세 보기
- ✅ 날짜 클릭하여 새 일정 추가
- ✅ 일정 등록/수정/삭제
- ✅ 필터링 (구성원, 일정 유형)

### 관리자 화면
- ✅ 팀 생성/수정/삭제
- ✅ 구성원 추가/수정/삭제
- ✅ 관리자 권한 부여/변경
- ✅ 검색 및 필터링

## 5. 문제 해결

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

