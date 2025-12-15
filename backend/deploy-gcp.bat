@echo off
chcp 65001 >nul
echo 🚀 Google Cloud Run 배포 시작...

set PROJECT_ID=open-calendar-481005
set SERVICE_NAME=calendar-backend
set REGION=asia-northeast3
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo.
echo 📦 Docker 이미지 빌드 중...
docker build -t %IMAGE_NAME%:latest .

if errorlevel 1 (
    echo ❌ Docker 빌드 실패
    exit /b 1
)

echo.
echo 📤 Google Container Registry에 푸시 중...
gcloud builds submit --tag %IMAGE_NAME%:latest --region %REGION%

if errorlevel 1 (
    echo ❌ 이미지 푸시 실패
    exit /b 1
)

echo.
echo 🌐 Cloud Run에 배포 중...
gcloud run deploy %SERVICE_NAME% --image %IMAGE_NAME%:latest --platform managed --region %REGION% --allow-unauthenticated --set-env-vars NODE_ENV=production,PORT=8080 --memory 512Mi --cpu 1 --min-instances 0 --max-instances 10 --timeout 300s

if errorlevel 1 (
    echo ❌ 배포 실패
    exit /b 1
)

echo.
echo ✅ 배포 완료!
echo.
echo 🌍 서비스 URL 확인 중...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format="value(status.url)"') do set SERVICE_URL=%%i
echo 서비스 URL: %SERVICE_URL%
echo.
echo 💡 환경 변수(DATABASE_URL, JWT_SECRET, CORS_ORIGIN)는 별도로 설정해야 합니다.
echo    명령어: gcloud run services update %SERVICE_NAME% --region %REGION% --set-env-vars KEY=value

