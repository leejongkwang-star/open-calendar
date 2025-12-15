# Google Cloud Run 배포 명령어 (단계별)
# 각 단계를 복사해서 실행하세요

$PROJECT_ID = "open-calendar-481005"
$SERVICE_NAME = "calendar-backend"
$REGION = "asia-northeast3"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "=== 1단계: Docker 이미지 빌드 ===" -ForegroundColor Yellow
Write-Host "docker build -t $IMAGE_NAME`:latest ." -ForegroundColor Cyan

Write-Host "`n=== 2단계: 이미지 푸시 ===" -ForegroundColor Yellow
Write-Host "gcloud builds submit --tag $IMAGE_NAME`:latest --region $REGION" -ForegroundColor Cyan

Write-Host "`n=== 3단계: Cloud Run 배포 ===" -ForegroundColor Yellow
Write-Host "gcloud run deploy $SERVICE_NAME --image $IMAGE_NAME`:latest --platform managed --region $REGION --allow-unauthenticated --set-env-vars NODE_ENV=production,PORT=8080 --memory 512Mi --cpu 1" -ForegroundColor Cyan

Write-Host "`n=== 4단계: 서비스 URL 확인 ===" -ForegroundColor Yellow
Write-Host "gcloud run services describe $SERVICE_NAME --region $REGION --format=`"value(status.url)`"" -ForegroundColor Cyan

