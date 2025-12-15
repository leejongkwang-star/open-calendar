# GitHub 트리거 생성 스크립트
# 사용 전에 GitHub 저장소 정보를 확인하고 수정하세요

Write-Host "GitHub 트리거 생성 중..." -ForegroundColor Green

# ⚠️ 여기에 실제 GitHub 저장소 정보를 입력하세요
$REPO_OWNER = "YOUR_GITHUB_USERNAME"  # 예: "blood"
$REPO_NAME = "YOUR_REPO_NAME"          # 예: "open-calendar-app"

Write-Host "`n⚠️  저장소 정보를 확인하세요:" -ForegroundColor Yellow
Write-Host "  저장소 소유자: $REPO_OWNER" -ForegroundColor Cyan
Write-Host "  저장소 이름: $REPO_NAME" -ForegroundColor Cyan
Write-Host "`n이 정보가 맞다면 스크립트를 수정하고 다시 실행하세요." -ForegroundColor Yellow

# 트리거 생성 (서비스 계정을 지정하지 않음 - 기본 Cloud Build 서비스 계정 사용)
# gcloud builds triggers create github `
#     --name="calendar-backend-deploy" `
#     --region="asia-northeast3" `
#     --repo-name="$REPO_NAME" `
#     --repo-owner="$REPO_OWNER" `
#     --branch-pattern="^main$" `
#     --build-config="backend/cloudbuild.yaml" `
#     --description="Deploy calendar backend to Cloud Run"

