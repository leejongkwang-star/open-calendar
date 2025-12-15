# GitHub Actions로 자동 배포 설정

Cloud Build 트리거의 서비스 계정 오류를 우회하여 GitHub Actions를 사용하는 방법입니다.

## 📋 사전 준비

- ✅ GitHub 저장소: `leejongkwang-star/open-calendar`
- ✅ Google Cloud 프로젝트: `open-calendar-481005`
- ✅ Artifact Registry 저장소 생성됨

---

## 🚀 설정 단계

### 1단계: 서비스 계정 생성 및 키 생성

Google Cloud에서 GitHub Actions가 사용할 서비스 계정을 생성합니다.

```powershell
# 서비스 계정 생성
gcloud iam service-accounts create github-actions-sa `
    --display-name="GitHub Actions Service Account" `
    --description="Service account for GitHub Actions deployment"

# 필요한 권한 부여
gcloud projects add-iam-policy-binding open-calendar-481005 `
    --member="serviceAccount:github-actions-sa@open-calendar-481005.iam.gserviceaccount.com" `
    --role="roles/run.admin" `
    --condition=None

gcloud projects add-iam-policy-binding open-calendar-481005 `
    --member="serviceAccount:github-actions-sa@open-calendar-481005.iam.gserviceaccount.com" `
    --role="roles/artifactregistry.writer" `
    --condition=None

gcloud projects add-iam-policy-binding open-calendar-481005 `
    --member="serviceAccount:github-actions-sa@open-calendar-481005.iam.gserviceaccount.com" `
    --role="roles/iam.serviceAccountUser" `
    --condition=None

# 서비스 계정 키 생성 (JSON 파일)
gcloud iam service-accounts keys create github-actions-key.json `
    --iam-account=github-actions-sa@open-calendar-481005.iam.gserviceaccount.com
```

---

### 2단계: GitHub Secrets 설정

1. **GitHub 저장소** → **Settings** → **Secrets and variables** → **Actions** 접속

2. **New repository secret** 클릭

3. 다음 Secret 추가:

   **이름**: `GCP_SA_KEY`  
   **값**: `github-actions-key.json` 파일의 전체 내용을 복사하여 붙여넣기

   > **참고**: JSON 파일의 모든 내용을 복사하세요 (중괄호 포함)

---

### 3단계: GitHub Actions 워크플로우 파일 확인

`.github/workflows/deploy-cloud-run.yml` 파일이 생성되어 있습니다.

이 파일은 다음을 수행합니다:
- `main` 브랜치에 푸시되면 자동 실행
- `backend/` 폴더 변경 시에만 실행
- Docker 이미지 빌드
- Artifact Registry에 푸시
- Cloud Run에 배포

---

### 4단계: 테스트

1. 코드 변경 후 GitHub에 푸시:
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow"
   git push origin main
   ```

2. GitHub 저장소 → **Actions** 탭에서 워크플로우 실행 확인

3. 빌드가 성공하면 Cloud Run 서비스가 자동으로 업데이트됩니다

---

## 🔧 문제 해결

### "Permission denied" 오류

서비스 계정에 권한이 부족할 수 있습니다:

```powershell
# 추가 권한 부여
gcloud projects add-iam-policy-binding open-calendar-481005 `
    --member="serviceAccount:github-actions-sa@open-calendar-481005.iam.gserviceaccount.com" `
    --role="roles/cloudbuild.builds.builder" `
    --condition=None
```

### "Image not found" 오류

Artifact Registry 저장소가 올바른지 확인:

```powershell
gcloud artifacts repositories list --location=asia-northeast3
```

### Secret이 인식되지 않음

- Secret 이름이 정확한지 확인: `GCP_SA_KEY`
- JSON 파일의 전체 내용을 복사했는지 확인
- GitHub 저장소 Settings에서 Secret이 보이는지 확인

---

## ✅ 장점

- ✅ Cloud Build 트리거의 서비스 계정 오류 우회
- ✅ GitHub에서 직접 관리 가능
- ✅ 빌드 로그를 GitHub에서 확인 가능
- ✅ 더 세밀한 제어 가능

---

## 📊 워크플로우 동작

1. `main` 브랜치에 코드 푸시
2. `backend/` 폴더 변경 감지
3. GitHub Actions 실행
4. Docker 이미지 빌드
5. Artifact Registry에 푸시
6. Cloud Run에 배포

---

**다음 단계**: 1단계부터 순서대로 진행하세요!

