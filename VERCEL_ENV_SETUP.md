# Vercel 환경 변수 설정 가이드

## 문제
프론트엔드가 백엔드 API에 연결하지 못하고 있습니다. Vercel 환경 변수를 설정해야 합니다.

## 해결 방법

### 1. Vercel 대시보드에서 설정

1. [Vercel Dashboard](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택: `open-calendar-frontend`
3. **Settings** → **Environment Variables**로 이동
4. 다음 환경 변수 추가:

```
변수명: VITE_API_BASE_URL
값: https://calendar-backend-750665560932.asia-northeast3.run.app/api
환경: Production, Preview, Development (모두 선택)
```

5. **Save** 클릭
6. **Deployments** 탭에서 최신 배포를 선택하고 **Redeploy** 클릭

---

### 2. Vercel CLI로 설정 (선택사항)

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 로그인
vercel login

# 프로젝트 디렉토리로 이동
cd frontend

# 환경 변수 설정
vercel env add VITE_API_BASE_URL production
# 값 입력: https://calendar-backend-750665560932.asia-northeast3.run.app/api

vercel env add VITE_API_BASE_URL preview
# 값 입력: https://calendar-backend-750665560932.asia-northeast3.run.app/api

vercel env add VITE_API_BASE_URL development
# 값 입력: https://calendar-backend-750665560932.asia-northeast3.run.app/api

# 재배포
vercel --prod
```

---

## 확인 방법

1. 환경 변수 설정 후 Vercel에서 자동으로 재배포되거나, 수동으로 재배포
2. 브라우저에서 `open-calendar-frontend.vercel.app` 접속
3. 개발자 도구(F12) → Console 탭에서 에러가 없는지 확인
4. Network 탭에서 API 요청이 `https://calendar-backend-750665560932.asia-northeast3.run.app/api/...`로 가는지 확인

---

## 현재 백엔드 URL

**서비스 URL**: `https://calendar-backend-750665560932.asia-northeast3.run.app`

**API Base URL** (환경 변수에 설정할 값):
```
https://calendar-backend-750665560932.asia-northeast3.run.app/api
```

---

## 참고

- `VITE_` 접두사가 붙은 환경 변수만 Vite에서 클라이언트 사이드 코드에 노출됩니다
- 환경 변수 변경 후에는 **반드시 재배포**해야 합니다
- 환경 변수 값에는 마지막에 슬래시(`/`)를 붙이지 마세요

