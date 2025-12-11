# 서버 수동 시작 가이드

## ⚠️ ERR_CONNECTION_REFUSED 오류 해결

현재 자동으로 서버가 시작되지 않았을 수 있습니다. 다음 방법으로 수동으로 시작하세요.

---

## 방법 1: 배치 파일 사용 (가장 쉬움) ⭐

프로젝트 루트 디렉토리에서 `START_SERVERS.bat` 파일을 **더블클릭**하세요.

이렇게 하면:
- 백엔드 서버가 별도 창에서 시작됩니다
- 프론트엔드 서버가 별도 창에서 시작됩니다

---

## 방법 2: 수동으로 터미널에서 시작

### 단계 1: 백엔드 서버 시작

**새 PowerShell 또는 CMD 창을 열고:**

```powershell
cd C:\Users\blood\OneDrive\문서\Cursor\open-calendar-app\backend
npm run dev
```

**예상 출력:**
```
Server running on port 3001
Database connected successfully
```

### 단계 2: 프론트엔드 서버 시작

**또 다른 새 PowerShell 또는 CMD 창을 열고:**

```powershell
cd C:\Users\blood\OneDrive\문서\Cursor\open-calendar-app\frontend
npm run dev
```

**예상 출력:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## 방법 3: PowerShell에서 새 창으로 시작

PowerShell에서 다음 명령어를 실행:

```powershell
# 백엔드 서버 (새 창)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\blood\OneDrive\문서\Cursor\open-calendar-app\backend'; npm run dev"

# 프론트엔드 서버 (새 창)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\blood\OneDrive\문서\Cursor\open-calendar-app\frontend'; npm run dev"
```

---

## 확인 사항

### ✅ 백엔드 서버 정상 작동 확인

브라우저에서 다음 URL을 열어보세요:
```
http://localhost:3001/api/auth/check-employee-number?employeeNumber=A1B2C3
```

**정상 응답 예시:**
```json
{"exists":false}
```

또는:
```json
{"exists":true}
```

### ✅ 프론트엔드 서버 정상 작동 확인

브라우저에서 다음 URL을 열어보세요:
```
http://localhost:5173
```

**정상 응답:**
- 회원가입 페이지 또는 로그인 페이지가 표시됩니다

---

## 🚨 문제가 계속되면

### 1. 포트 사용 중인지 확인

```powershell
# 포트 3001 확인
netstat -ano | findstr :3001

# 포트 5173 확인
netstat -ano | findstr :5173
```

포트가 사용 중이면 해당 프로세스를 종료하세요.

### 2. 데이터베이스 연결 확인

`backend/.env` 파일이 존재하고 올바른 `DATABASE_URL`이 설정되어 있는지 확인하세요.

### 3. 의존성 설치 확인

```powershell
# 백엔드
cd backend
npm install

# 프론트엔드
cd frontend
npm install
```

### 4. Prisma 클라이언트 생성 확인

```powershell
cd backend
npm run prisma:generate
```

---

## 📝 참고

- 백엔드와 프론트엔드는 **별도의 터미널 창**에서 실행해야 합니다
- 서버를 종료하려면 각 터미널 창에서 `Ctrl + C`를 누르세요
- `START_SERVERS.bat` 파일을 사용하면 가장 쉽게 시작할 수 있습니다

