# 🚀 배포 가이드 - 빠른 시작

## 📋 배포 구성

이 프로젝트는 다음 플랫폼을 사용하여 배포합니다:

- **프론트엔드**: [Vercel](https://vercel.com) ⭐
- **백엔드**: [Render](https://render.com) ⭐
- **데이터베이스**: [Supabase](https://supabase.com) (PostgreSQL)

---

## 📚 상세 배포 가이드

### 프론트엔드 (Vercel)
👉 [`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) 파일을 참고하세요.

### 백엔드 (Render)
👉 [`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md) 파일을 참고하세요.

### 전체 배포 가이드
👉 [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) 파일을 참고하세요.

---

## 🎯 빠른 배포 단계

### 1단계: 백엔드 배포 (Render)

1. [Render](https://render.com) 접속 및 로그인
2. **New** → **Web Service** 클릭
3. GitHub 리포지토리 연결
4. 설정:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Start Command**: `npm start`
5. 환경 변수 설정:
   - `DATABASE_URL` (Supabase)
   - `JWT_SECRET` (랜덤 문자열, 32자 이상)
   - `CORS_ORIGIN` (프론트엔드 URL은 나중에)
   - `NODE_ENV=production`
   - `PORT=3001`
6. 배포 완료 후 백엔드 URL 확인 (예: `https://calendar-backend.onrender.com`)

### 2단계: 프론트엔드 배포 (Vercel)

1. [Vercel](https://vercel.com) 접속 및 로그인
2. **Add New Project** 클릭
3. GitHub 리포지토리 연결
4. 설정:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 환경 변수 설정:
   - `VITE_API_BASE_URL` = `https://your-backend.onrender.com/api`
6. 배포 완료 후 프론트엔드 URL 확인 (예: `https://your-project.vercel.app`)

### 3단계: CORS 설정 업데이트

1. Render 대시보드로 돌아가기
2. **Environment Variables** 수정:
   - `CORS_ORIGIN` = `https://your-project.vercel.app`
3. 재배포 또는 환경 변수만 업데이트

### 4단계: Prisma 마이그레이션

1. Render 대시보드 → **Shell** 탭
2. 다음 명령어 실행:
   ```bash
   npx prisma migrate deploy
   ```

---

## ✅ 배포 후 확인

1. 프론트엔드 접속: `https://your-project.vercel.app`
2. 백엔드 API 테스트: `https://your-backend.onrender.com/api/teams`
3. 로그인/회원가입 기능 테스트
4. 일정 생성/수정/삭제 기능 테스트

---

## 🔗 관련 문서

- [Vercel 배포 가이드](./VERCEL_DEPLOY.md)
- [Render 배포 가이드](./RENDER_DEPLOY.md)
- [전체 배포 가이드](./DEPLOYMENT_GUIDE.md)
- [빠른 배포 가이드](./QUICK_DEPLOY.md)

---

## 💡 문제 해결

### CORS 오류
- Render의 `CORS_ORIGIN` 환경 변수가 정확한 프론트엔드 URL과 일치하는지 확인

### 환경 변수 적용 안 됨
- Vercel: 환경 변수 설정 후 **Redeploy** 필요
- Render: 환경 변수만 업데이트하면 자동 재시작

### 데이터베이스 연결 오류
- Supabase 연결 문자열 확인
- Prisma 마이그레이션 실행 확인

자세한 내용은 각 배포 가이드 문서를 참고하세요.

