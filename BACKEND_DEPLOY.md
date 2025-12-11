# 백엔드 배포 가이드

## 📋 배포 구성
- **백엔드**: Render (권장) ⭐
- **프론트엔드**: Vercel ([`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) 참고)

## ✅ 배포 준비 완료
- ✅ `render.yaml` 설정 파일 생성
- ✅ `Procfile` 생성 완료

---

## 🚀 배포 방법

### ⭐ 방법 1: Render (권장, 무료 티어 제공)

**이 프로젝트는 Render를 사용하여 백엔드를 배포합니다.**

자세한 내용은 [`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md) 파일을 참고하세요.

#### 빠른 요약:
1. [Render](https://render.com) 접속 및 로그인
2. **New** → **Web Service** 클릭
3. GitHub 리포지토리 연결
4. **Root Directory**: `backend` 설정
5. **Build Command**: `npm install && npm run prisma:generate`
6. **Start Command**: `npm start`
7. 환경 변수 설정 (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` 등)
8. Prisma 마이그레이션 실행

---

### 기타 옵션 (참고용)

#### 방법 2: Railway (대체 옵션)

#### Railway CLI 사용:

1. **Railway CLI 설치**
   ```bash
   npm install -g @railway/cli
   ```

2. **로그인**
   ```bash
   railway login
   ```

3. **프로젝트 초기화 및 배포**
   ```bash
   cd backend
   railway init
   railway up
   ```

4. **환경 변수 설정**
   ```bash
   railway variables set DATABASE_URL="your-database-url"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set CORS_ORIGIN="https://your-frontend.vercel.app"
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   ```

5. **Prisma 마이그레이션**
   ```bash
   railway run npm run prisma:generate
   railway run npx prisma migrate deploy
   ```

#### Railway 웹 대시보드 사용:

1. [Railway](https://railway.app) 접속 및 로그인
2. **New Project** 클릭
3. **Deploy from GitHub repo** 선택 (GitHub 연동)
   - 또는 **Empty Project** → **Add Service** → **GitHub Repo**
4. `backend` 폴더 선택
5. **Variables** 탭에서 환경 변수 설정:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `NODE_ENV=production`
   - `PORT=3001`
6. **Settings** → **Deploy** 설정:
   - **Root Directory**: `backend` (또는 `.`)
   - **Build Command**: `npm run prisma:generate`
   - **Start Command**: `npm start`
7. 배포 시작

---

### 방법 3: 기타 Render 설정 (참고)

1. [Render](https://render.com) 접속 및 로그인
2. **New** → **Web Service** 클릭
3. GitHub 리포지토리 연결 또는 직접 배포
4. 설정:
   - **Name**: calendar-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`
5. **Environment Variables** 추가:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `NODE_ENV=production`
   - `PORT=3001`
6. **Create Web Service** 클릭

---

### 방법 3: Heroku

1. **Heroku CLI 설치 및 로그인**
   ```bash
   heroku login
   ```

2. **프로젝트 생성**
   ```bash
   cd backend
   heroku create your-app-name
   ```

3. **환경 변수 설정**
   ```bash
   heroku config:set DATABASE_URL="your-database-url"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set CORS_ORIGIN="https://your-frontend.vercel.app"
   heroku config:set NODE_ENV=production
   ```

4. **Prisma 마이그레이션**
   ```bash
   heroku run npm run prisma:generate
   heroku run npx prisma migrate deploy
   ```

5. **배포**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-app-name
   git push heroku main
   ```

---

## 🔐 필수 환경 변수

배포 시 다음 환경 변수를 설정해야 합니다:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-strong-random-secret-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="https://your-frontend.vercel.app"
NODE_ENV=production
PORT=3001
```

### JWT_SECRET 생성 방법:
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 📝 배포 후 확인사항

1. **API 엔드포인트 확인**
   ```bash
   curl https://your-backend.railway.app/api/health
   # 또는
   curl https://your-backend.railway.app/api/teams
   ```

2. **로그 확인**
   - Railway: Deployments → 해당 배포 → Logs
   - Render: Logs 탭
   - Heroku: `heroku logs --tail`

3. **데이터베이스 연결 확인**
   - 로그에서 Prisma 연결 메시지 확인
   - API 호출 테스트

---

## 🔄 재배포

코드 변경 후:
- Railway: 자동 재배포 (GitHub 연동 시)
- Render: 자동 재배포
- Heroku: `git push heroku main`

---

## 🆘 문제 해결

### Prisma 마이그레이션 실패
```bash
# Railway
railway run npx prisma migrate deploy

# Render
# Build Command에 추가: && npx prisma migrate deploy

# Heroku
heroku run npx prisma migrate deploy
```

### 환경 변수 적용 안 됨
- 환경 변수 설정 후 재배포 필요
- 로그에서 환경 변수 확인

### 포트 오류
- `PORT` 환경 변수 확인
- 플랫폼이 자동으로 `PORT` 환경 변수를 제공하는 경우, 코드에서 `process.env.PORT` 사용 확인


