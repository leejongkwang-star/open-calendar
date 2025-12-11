# 서버 시작 가이드 및 연결 오류 해결

## 🔧 서버 포트 정보

- **백엔드 서버**: `http://localhost:3001`
- **프론트엔드 서버**: `http://localhost:5173`
- **백엔드 API 기본 경로**: `http://localhost:3001/api`

## ❌ ERR_CONNECTION_REFUSED 오류 해결 방법

### 1. 백엔드 서버가 실행 중인지 확인

```bash
# 백엔드 디렉토리로 이동
cd backend

# 서버 시작
npm run dev
```

**예상 출력:**
```
Server running on port 3001
Database connected successfully
```

### 2. 프론트엔드 서버 확인

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 서버 시작
npm run dev
```

**예상 출력:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. 환경 변수 확인

백엔드 서버가 정상적으로 작동하려면 `.env` 파일이 필요합니다.

**backend/.env 파일 확인:**
```env
PORT=3001
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

### 4. 데이터베이스 연결 확인

백엔드 서버가 시작되지 않는 경우:

1. **데이터베이스 URL 확인**
   - Supabase 또는 PostgreSQL 연결 문자열 확인
   - Pooler 모드 사용 시 URL 형식 확인

2. **Prisma 클라이언트 생성**
   ```bash
   cd backend
   npm run prisma:generate
   ```

3. **마이그레이션 확인**
   ```bash
   cd backend
   npm run prisma:migrate
   ```

### 5. 포트 충돌 확인

다른 프로그램이 포트를 사용 중일 수 있습니다:

**Windows:**
```powershell
# 포트 3001 사용 중인 프로세스 확인
netstat -ano | findstr :3001

# 포트 5173 사용 중인 프로세스 확인
netstat -ano | findstr :5173
```

### 6. 프론트엔드 환경 변수 확인

프론트엔드에서 백엔드 API URL을 올바르게 설정했는지 확인:

**frontend/.env 파일 (선택사항):**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**참고:** 기본값이 `http://localhost:3001/api`로 설정되어 있어서 `.env` 파일이 없어도 작동해야 합니다.

## 🔍 문제 해결 체크리스트

- [ ] 백엔드 서버가 포트 3001에서 실행 중인가?
- [ ] 프론트엔드 서버가 포트 5173에서 실행 중인가?
- [ ] `backend/.env` 파일이 존재하고 올바른 설정인가?
- [ ] 데이터베이스 연결이 정상인가?
- [ ] Prisma 클라이언트가 생성되었는가?
- [ ] 포트 충돌이 없는가?
- [ ] 브라우저에서 `http://localhost:3001/api` 접속 시 응답이 오는가?

## 📝 수동 서버 시작 방법

### 방법 1: 별도 터미널 창 사용 (권장)

**터미널 1 - 백엔드:**
```bash
cd backend
npm run dev
```

**터미널 2 - 프론트엔드:**
```bash
cd frontend
npm run dev
```

### 방법 2: 동시 실행 (Windows)

**PowerShell:**
```powershell
# 백엔드 시작 (백그라운드)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# 프론트엔드 시작 (백그라운드)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

## 🚨 자주 발생하는 오류

### 오류 1: Cannot find module '@prisma/client'

**해결:**
```bash
cd backend
npm install
npm run prisma:generate
```

### 오류 2: DATABASE_URL is not set

**해결:**
- `backend/.env` 파일 생성
- `DATABASE_URL` 환경 변수 설정

### 오류 3: Port 3001 already in use

**해결:**
- 다른 프로세스 종료
- 또는 `backend/.env`에서 `PORT=3002` 등으로 변경

## 💡 빠른 테스트

백엔드 서버가 정상 작동하는지 확인:

```bash
# 브라우저 또는 curl로 테스트
curl http://localhost:3001/api/auth/check-employee-number?employeeNumber=A1B2C3
```

또는 브라우저에서:
```
http://localhost:3001/api/auth/check-employee-number?employeeNumber=A1B2C3
```

정상 응답: `{"exists":true}` 또는 `{"exists":false}`

---

**서버 시작 후 브라우저에서 `http://localhost:5173` 접속하여 확인하세요!**

