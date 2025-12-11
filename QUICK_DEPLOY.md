# 빠른 배포 가이드

## 📋 배포 구성
- **프론트엔드**: Vercel ⭐
- **백엔드**: Render ⭐

## 현재 상태
- ✅ 프론트엔드 빌드 완료 (`dist/` 폴더)
- ✅ 배포 준비 완료

---

## 🚀 프론트엔드 배포 (Vercel)

### 방법 1: Vercel (권장)

### 단계:
1. [Netlify](https://netlify.com) 접속 및 로그인
2. Sites → Add new site → Deploy manually
3. `frontend/dist` 폴더를 드래그 앤 드롭
4. 배포 완료!

### 환경 변수 설정:
- Site settings → Environment variables
- `VITE_API_BASE_URL` 추가 (값: 백엔드 API URL)
- Site 다시 배포 필요

---

### 방법 2: Vercel 웹 대시보드

자세한 내용은 [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) 파일을 참고하세요.

### Vercel CLI 설치 및 배포:

```bash
# Vercel CLI 설치 (전역)
npm install -g vercel

# 배포
cd frontend
vercel

# 프로덕션 배포
vercel --prod
```

### 환경 변수 설정:
- Vercel 대시보드 → Project Settings → Environment Variables
- `VITE_API_BASE_URL` 추가

---

---

## 🚀 백엔드 배포 (Render)

### Render 배포

**자세한 내용은 [`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md) 파일을 참고하세요.**

#### 빠른 요약:
1. [Render](https://render.com) 접속 및 로그인
2. **New** → **Web Service** 클릭
3. GitHub 리포지토리 연결
4. **Root Directory**: `backend` 설정
5. **Build Command**: `npm install && npm run prisma:generate`
6. **Start Command**: `npm start`
7. 환경 변수 설정:
   - `DATABASE_URL` (Supabase 연결 문자열)
   - `JWT_SECRET` (강력한 랜덤 문자열)
   - `CORS_ORIGIN` (Vercel 프론트엔드 URL)
   - `NODE_ENV=production`
   - `PORT=3001`
8. 배포 후 Prisma 마이그레이션 실행

---

## 배포 전 확인사항

### 프론트엔드 환경 변수 (Vercel):
- `VITE_API_BASE_URL`: Render 백엔드 API URL
  - 예: `https://your-backend.onrender.com/api`
  - 백엔드 배포 완료 후 실제 URL로 변경 필요

### 백엔드 환경 변수 (Render):
- `DATABASE_URL`: Supabase 연결 문자열
- `JWT_SECRET`: 강력한 랜덤 문자열 (32자 이상)
- `CORS_ORIGIN`: Vercel 프론트엔드 URL (예: `https://your-frontend.vercel.app`)
- `NODE_ENV=production`
- `PORT=3001`

### 배포 순서:
1. **백엔드 (Render) 먼저 배포** → URL 확인
2. **프론트엔드 (Vercel) 배포** → 백엔드 URL을 환경 변수로 설정

---

## 배포 후 확인

1. 웹사이트 접속 확인
2. 로그인 화면 표시 확인
3. 브라우저 개발자 도구 Console/Network 확인
4. API 연결 확인

