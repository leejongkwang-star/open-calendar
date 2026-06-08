# Cloud Run 배포 스크립트 템플릿 (이 파일은 시크릿이 없어 커밋해도 안전합니다)
#
# 사용법:
#   1) 이 파일을 deploy-with-env.ps1 로 복사합니다. (deploy-with-env.ps1 은 .gitignore 처리됨)
#   2) 시크릿은 셸 환경 변수나 backend/.env 에 설정합니다. 절대 파일에 하드코딩하지 마세요.
#
#   $env:DATABASE_URL = "postgresql://..."
#   $env:JWT_SECRET   = "..."
#   $env:CORS_ORIGIN  = "https://your-frontend.example.com"
#   .\deploy-with-env.ps1

$PROJECT_ID = "open-calendar-481005"
$SERVICE_NAME = "calendar-backend"
$REGION = "asia-northeast3"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# .env 파일이 있으면 환경 변수로 로드 (KEY="value" 형식 지원)
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "📄 .env 파일에서 환경 변수를 로드합니다..." -ForegroundColor DarkGray
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $idx = $line.IndexOf("=")
            $key = $line.Substring(0, $idx).Trim()
            $value = $line.Substring($idx + 1).Trim().Trim('"')
            if ($key) {
                Set-Item -Path "env:$key" -Value $value
            }
        }
    }
}

# 필수 시크릿이 설정되었는지 검증
$DATABASE_URL = $env:DATABASE_URL
$JWT_SECRET = $env:JWT_SECRET
$CORS_ORIGIN = $env:CORS_ORIGIN

$missing = @()
if (-not $DATABASE_URL) { $missing += "DATABASE_URL" }
if (-not $JWT_SECRET) { $missing += "JWT_SECRET" }
if (-not $CORS_ORIGIN) { $missing += "CORS_ORIGIN" }

if ($missing.Count -gt 0) {
    Write-Host "❌ 다음 환경 변수가 설정되지 않았습니다: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "   셸에서 직접 설정하거나 backend/.env 파일에 추가한 뒤 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Cloud Run 배포 시작..." -ForegroundColor Green

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
