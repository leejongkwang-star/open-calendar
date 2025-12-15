# Google Cloud Run 배포 스크립트
# 사용법: .\deploy-gcp.ps1

$PROJECT_ID = "open-calendar-481005"
$SERVICE_NAME = "calendar-backend"
$REGION = "asia-northeast3"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "🚀 Google Cloud Run 배포 시작..." -ForegroundColor Green

# 1. Docker 이미지 빌드
Write-Host "`n📦 Docker 이미지 빌드 중..." -ForegroundColor Yellow
docker build -t $IMAGE_NAME:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker 빌드 실패" -ForegroundColor Red
    exit 1
}

# 2. Google Container Registry에 푸시
Write-Host "`n📤 Google Container Registry에 푸시 중..." -ForegroundColor Yellow
gcloud builds submit --tag $IMAGE_NAME:latest --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 이미지 푸시 실패" -ForegroundColor Red
    exit 1
}

# 3. Cloud Run에 배포
Write-Host "`n🌐 Cloud Run에 배포 중..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME:latest `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars NODE_ENV=production,PORT=8080 `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --timeout 300s

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 배포 실패" -ForegroundColor Red
    exit 1
}

# 4. 서비스 URL 확인
Write-Host "`n✅ 배포 완료!" -ForegroundColor Green
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"
Write-Host "🌍 서비스 URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "`n💡 환경 변수(DATABASE_URL, JWT_SECRET, CORS_ORIGIN)는 별도로 설정해야 합니다." -ForegroundColor Yellow
Write-Host "   명령어: gcloud run services update $SERVICE_NAME --region $REGION --set-env-vars KEY=value" -ForegroundColor Yellow

