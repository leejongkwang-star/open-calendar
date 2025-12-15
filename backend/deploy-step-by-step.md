# 단계별 배포 가이드

PowerShell 스크립트 실행에 문제가 있다면, 다음 명령어를 **순서대로** 실행하세요.

## 1단계: Docker 이미지 빌드

```powershell
cd backend
docker build -t gcr.io/open-calendar-481005/calendar-backend:latest .
```

## 2단계: Google Container Registry에 푸시

```powershell
gcloud builds submit --tag gcr.io/open-calendar-481005/calendar-backend:latest --region asia-northeast3
```

## 3단계: Cloud Run에 배포

```powershell
gcloud run deploy calendar-backend `
    --image gcr.io/open-calendar-481005/calendar-backend:latest `
    --platform managed `
    --region asia-northeast3 `
    --allow-unauthenticated `
    --set-env-vars NODE_ENV=production,PORT=8080 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --timeout 300s
```

## 4단계: 서비스 URL 확인

```powershell
gcloud run services describe calendar-backend --region asia-northeast3 --format="value(status.url)"
```

## 5단계: 환경 변수 설정 (필수)

```powershell
gcloud run services update calendar-backend `
    --region asia-northeast3 `
    --set-env-vars DATABASE_URL="your-supabase-url",JWT_SECRET="your-jwt-secret",CORS_ORIGIN="https://your-frontend.vercel.app"
```

---

## 대안: 배치 파일 사용

PowerShell 대신 배치 파일을 사용할 수도 있습니다:

```cmd
cd backend
deploy-gcp.bat
```

