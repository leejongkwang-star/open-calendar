# 환경 변수를 포함한 배포 스크립트
# 사용 전에 환경 변수 값을 설정하세요!

$PROJECT_ID = "open-calendar-481005"
$SERVICE_NAME = "calendar-backend"
$REGION = "asia-northeast3"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# ⚠️ 여기에 실제 값으로 변경하세요!
$DATABASE_URL = "postgresql://postgres.eoaoniysfxbtzfukqhiy:***REMOVED***@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
$JWT_SECRET = "***REMOVED***"
$CORS_ORIGIN = "https://open-calendar-frontend.vercel.app"

Write-Host "🚀 Cloud Run 배포 시작..." -ForegroundColor Green

# 배포 (환경 변수 포함)
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME:latest `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars "NODE_ENV=production,PORT=8080,DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,CORS_ORIGIN=$CORS_ORIGIN" `
    --memory 512Mi `
    --cpu 1 `
    --timeout 300s

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 배포 완료!" -ForegroundColor Green
    $SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"
    Write-Host "🌍 서비스 URL: $SERVICE_URL" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ 배포 실패" -ForegroundColor Red
}

