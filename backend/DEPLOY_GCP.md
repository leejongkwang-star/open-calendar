# Google Cloud Run 배포 가이드 (빠른 시작)

## 📋 사전 준비

✅ Google Cloud SDK 설치 완료
✅ 프로젝트 설정 완료: `open-calendar-481005`
✅ 리전 설정 완료: `asia-northeast3` (서울)

---

## 🚀 배포 단계

### 1. 필요한 API 활성화

PowerShell에서 실행:

```powershell
# Cloud Run API 활성화
gcloud services enable run.googleapis.com

# Container Registry API 활성화
gcloud services enable containerregistry.googleapis.com

# Cloud Build API 활성화
gcloud services enable cloudbuild.googleapis.com
```

### 2. Docker 설치 확인

```powershell
docker --version
```

Docker가 설치되어 있지 않다면 [Docker Desktop](https://www.docker.com/products/docker-desktop)을 설치하세요.

### 3. 배포 실행

#### 방법 A: 자동 배포 스크립트 사용 (권장)

```powershell
cd backend
.\deploy-gcp.ps1
```

#### 방법 B: 수동 배포

```powershell
cd backend

# 프로젝트 변수 설정
$PROJECT_ID = "open-calendar-481005"
$SERVICE_NAME = "calendar-backend"
$REGION = "asia-northeast3"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# 1. Docker 이미지 빌드
docker build -t $IMAGE_NAME:latest .

# 2. Google Container Registry에 푸시
gcloud builds submit --tag $IMAGE_NAME:latest --region $REGION

# 3. Cloud Run에 배포 (환경 변수 없이)
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME:latest `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars NODE_ENV=production,PORT=8080 `
    --memory 512Mi `
    --cpu 1
```

### 4. 환경 변수 설정

배포 후 환경 변수를 설정해야 합니다:

#### 방법 A: Secret Manager 사용 (권장, 보안)

```powershell
# Secret 생성
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "https://your-frontend.vercel.app" | gcloud secrets create CORS_ORIGIN --data-file=-

# Secret에 접근 권한 부여
$PROJECT_NUMBER = (gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding DATABASE_URL `
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET `
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding CORS_ORIGIN `
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
    --role="roles/secretmanager.secretAccessor"

# Cloud Run 서비스에 Secret 마운트
gcloud run services update calendar-backend `
    --region asia-northeast3 `
    --update-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,CORS_ORIGIN=CORS_ORIGIN:latest
```

#### 방법 B: 직접 환경 변수 설정 (간단)

```powershell
gcloud run services update calendar-backend `
    --region asia-northeast3 `
    --set-env-vars DATABASE_URL="your-database-url",JWT_SECRET="your-jwt-secret",CORS_ORIGIN="https://your-frontend.vercel.app"
```

> ⚠️ **보안 주의**: 이 방법은 환경 변수가 평문으로 저장됩니다. 프로덕션 환경에서는 Secret Manager 사용을 권장합니다.

### 5. 서비스 URL 확인

```powershell
gcloud run services describe calendar-backend --region asia-northeast3 --format="value(status.url)"
```

### 6. Health Check 테스트

```powershell
$SERVICE_URL = gcloud run services describe calendar-backend --region asia-northeast3 --format="value(status.url)"
curl "$SERVICE_URL/health"
```

---

## 🔧 문제 해결

### Docker 빌드 실패

```powershell
# Docker가 실행 중인지 확인
docker ps

# Docker Desktop이 실행되어 있는지 확인
```

### 이미지 푸시 실패

```powershell
# 인증 확인
gcloud auth configure-docker

# 다시 시도
gcloud builds submit --tag gcr.io/open-calendar-481005/calendar-backend:latest --region asia-northeast3
```

### 배포 실패

```powershell
# 로그 확인
gcloud run services logs tail calendar-backend --region asia-northeast3

# 서비스 상태 확인
gcloud run services describe calendar-backend --region asia-northeast3
```

---

## 📊 배포 후 확인사항

- [ ] 서비스 URL 확인
- [ ] Health check (`/health`) 통과
- [ ] 환경 변수 설정 확인
- [ ] 프론트엔드에서 API 연결 테스트
- [ ] 로그 확인 (에러 없음)

---

## 💰 비용 확인

Google Cloud Run은 사용한 만큼만 과금됩니다:
- **무료 티어**: 월 200만 요청
- **추가 비용**: $0.40/100만 요청

비용 확인:
```powershell
# Cloud Console에서 확인
# https://console.cloud.google.com/run
```

---

## 🔄 재배포

코드 변경 후 재배포:

```powershell
cd backend
.\deploy-gcp.ps1
```

또는 수동으로:

```powershell
docker build -t gcr.io/open-calendar-481005/calendar-backend:latest .
gcloud builds submit --tag gcr.io/open-calendar-481005/calendar-backend:latest --region asia-northeast3
gcloud run deploy calendar-backend --image gcr.io/open-calendar-481005/calendar-backend:latest --region asia-northeast3
```

---

## 📚 참고 자료

- [Cloud Run 공식 문서](https://cloud.google.com/run/docs)
- [Cloud Run 가격](https://cloud.google.com/run/pricing)
- [상세 마이그레이션 가이드](./MIGRATION_GCP_CLOUD_RUN.md)

