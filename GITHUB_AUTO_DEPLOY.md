# GitHub 자동 배포 설정 가이드 (Google Cloud Run)

이 가이드는 GitHub 저장소와 Google Cloud Run을 연동하여 코드가 푸시될 때마다 자동으로 빌드하고 배포하는 방법을 설명합니다.

---

## 📋 사전 준비

- ✅ Google Cloud 프로젝트: `open-calendar-481005`
- ✅ Cloud Run 서비스: `calendar-backend` (이미 배포됨)
- ✅ GitHub 저장소
- ✅ 필요한 API 활성화됨

---

## 🚀 단계별 설정

### 1단계: Artifact Registry 저장소 생성

Artifact Registry는 Docker 이미지를 저장하는 저장소입니다.

```powershell
# Artifact Registry API 활성화
gcloud services enable artifactregistry.googleapis.com

# Docker 이미지 저장소 생성
gcloud artifacts repositories create calendar-backend \
    --repository-format=docker \
    --location=asia-northeast3 \
    --description="Calendar Backend Docker images"
```

---

### 2단계: Cloud Build 서비스 계정 권한 설정

Cloud Build가 Cloud Run에 배포할 수 있도록 권한을 부여합니다.

```powershell
# 프로젝트 번호 확인
$PROJECT_NUMBER = (gcloud projects describe open-calendar-481005 --format="value(projectNumber)")

# Cloud Build 서비스 계정에 Cloud Run 관리자 권한 부여
gcloud projects add-iam-policy-binding open-calendar-481005 \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/run.admin"

# Artifact Registry 작성자 권한 부여
gcloud projects add-iam-policy-binding open-calendar-481005 \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

# Service Account 사용자 권한 부여 (배포 시 필요)
gcloud projects add-iam-policy-binding open-calendar-481005 \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

---

### 3단계: Docker 인증 설정

Artifact Registry에 이미지를 푸시하기 위한 인증 설정:

```powershell
gcloud auth configure-docker asia-northeast3-docker.pkg.dev
```

---

### 4단계: GitHub 저장소와 Cloud Build 연결

#### 방법 A: Cloud Console 사용 (권장)

1. [Cloud Console](https://console.cloud.google.com/cloud-build/triggers?project=open-calendar-481005) 접속
2. **트리거** 탭 클릭
3. **트리거 만들기** 클릭
4. **소스** 선택:
   - **소스**: GitHub (처음이면 연결 필요)
   - GitHub 저장소 선택 또는 연결
   - **분기**: `main` 또는 `master` (원하는 브랜치)
5. **구성** 선택:
   - **구성 유형**: Cloud Build 구성 파일 (yaml 또는 json)
   - **위치**: `backend/cloudbuild.yaml`
6. **이름**: `calendar-backend-deploy`
7. **만들기** 클릭

#### 방법 B: gcloud CLI 사용

```powershell
# GitHub 연결 (처음인 경우)
gcloud builds triggers create github \
    --name="calendar-backend-deploy" \
    --region="asia-northeast3" \
    --repo-name="YOUR_REPO_NAME" \
    --repo-owner="YOUR_GITHUB_USERNAME" \
    --branch-pattern="^main$" \
    --build-config="backend/cloudbuild.yaml" \
    --description="Deploy calendar backend to Cloud Run"
```

> ⚠️ **참고**: `YOUR_REPO_NAME`과 `YOUR_GITHUB_USERNAME`를 실제 값으로 변경하세요.

---

### 5단계: cloudbuild.yaml 파일 확인

`backend/cloudbuild.yaml` 파일이 프로젝트 루트에 있는지 확인하세요. 이 파일은 이미 생성되어 있습니다.

파일 위치: `backend/cloudbuild.yaml`

---

### 6단계: 환경 변수 설정

Cloud Run 서비스에 환경 변수가 이미 설정되어 있는지 확인:

```powershell
# 현재 환경 변수 확인
gcloud run services describe calendar-backend \
    --region asia-northeast3 \
    --format="value(spec.template.spec.containers[0].env)"
```

환경 변수가 없다면 설정:

```powershell
gcloud run services update calendar-backend \
    --region asia-northeast3 \
    --set-env-vars "NODE_ENV=production,DATABASE_URL=your-db-url,JWT_SECRET=your-secret,CORS_ORIGIN=https://open-calendar-frontend.vercel.app"
```

---

### 7단계: 테스트

1. GitHub 저장소에 코드 변경사항 푸시:
   ```bash
   git add .
   git commit -m "Test auto deploy"
   git push origin main
   ```

2. [Cloud Build 히스토리](https://console.cloud.google.com/cloud-build/builds?project=open-calendar-481005)에서 빌드 상태 확인

3. 빌드가 완료되면 Cloud Run 서비스가 자동으로 업데이트됩니다

---

## 🔧 고급 설정

### 특정 브랜치만 배포

`cloudbuild.yaml`을 수정하거나 트리거에서 브랜치 패턴을 조정:

```yaml
# cloudbuild.yaml에 브랜치 체크 추가
substitutions:
  _BRANCH_NAME: '${BRANCH_NAME}'
```

또는 트리거 설정에서:
- **분기**: `^main$|^production$` (여러 브랜치 지원)

---

### 환경별 배포 (Staging/Production)

#### 방법 1: 별도 트리거 사용

1. `main` 브랜치 → Production 환경
2. `develop` 브랜치 → Staging 환경

각각 다른 `cloudbuild.yaml` 또는 다른 환경 변수 사용:

```powershell
# Production 트리거
gcloud builds triggers create github \
    --name="calendar-backend-prod" \
    --branch-pattern="^main$" \
    --build-config="backend/cloudbuild.yaml" \
    --substitutions="_ENV=production"

# Staging 트리거
gcloud builds triggers create github \
    --name="calendar-backend-staging" \
    --branch-pattern="^develop$" \
    --build-config="backend/cloudbuild-staging.yaml" \
    --substitutions="_ENV=staging"
```

#### 방법 2: 조건부 배포

`cloudbuild.yaml`에서 환경 변수로 구분:

```yaml
substitutions:
  _ENV: 'production'  # 기본값

steps:
  # ... 빌드 단계 ...
  
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'calendar-backend-${_ENV}'  # 환경별 서비스명
      # ...
```

---

### 환경 변수를 Secret Manager로 관리

민감한 정보는 Secret Manager에 저장:

```powershell
# Secret 생성
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-

# Secret 접근 권한 부여
$PROJECT_NUMBER = (gcloud projects describe open-calendar-481005 --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# cloudbuild.yaml에서 Secret 사용
# Cloud Run 배포 단계에서:
# --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest
```

---

## 📊 모니터링

### 빌드 알림 설정

1. [Cloud Build 설정](https://console.cloud.google.com/cloud-build/settings?project=open-calendar-481005)
2. **알림** 탭에서 이메일 또는 Pub/Sub 설정

### 빌드 로그 확인

```powershell
# 최근 빌드 목록
gcloud builds list --limit=10

# 특정 빌드 로그 확인
gcloud builds log BUILD_ID
```

---

## 🔍 문제 해결

### 빌드 실패 시

1. [Cloud Build 로그](https://console.cloud.google.com/cloud-build/builds?project=open-calendar-481005) 확인
2. 각 단계별 로그 확인
3. 일반적인 원인:
   - Dockerfile 오류
   - 권한 문제
   - 환경 변수 누락

### 권한 오류

```powershell
# 필요한 권한 재부여
$PROJECT_NUMBER = (gcloud projects describe open-calendar-481005 --format="value(projectNumber)")
gcloud projects add-iam-policy-binding open-calendar-481005 \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/run.admin"
```

### 이미지 푸시 실패

```powershell
# Artifact Registry 권한 확인
gcloud artifacts repositories get-iam-policy calendar-backend \
    --location=asia-northeast3
```

---

## ✅ 체크리스트

- [ ] Artifact Registry 저장소 생성
- [ ] Cloud Build 서비스 계정 권한 설정
- [ ] GitHub 저장소 연결
- [ ] 트리거 생성
- [ ] `cloudbuild.yaml` 파일 확인
- [ ] 환경 변수 설정 확인
- [ ] 테스트 배포 성공
- [ ] 모니터링 설정

---

## 📚 참고 자료

- [Cloud Build 문서](https://cloud.google.com/build/docs)
- [Cloud Run 배포](https://cloud.google.com/run/docs/deploying)
- [Artifact Registry](https://cloud.google.com/artifact-registry/docs)
- [GitHub 소스 연결](https://cloud.google.com/build/docs/automating-builds/github)

---

## 💡 팁

1. **빌드 캐싱**: Docker 빌드 시간을 단축하기 위해 `.dockerignore` 파일 확인
2. **병렬 빌드**: 여러 서비스를 동시에 배포하려면 `waitFor` 사용
3. **롤백**: 문제 발생 시 이전 리비전으로 빠르게 롤백 가능
4. **비용**: Cloud Build는 빌드 시간당 과금 (무료 티어: 월 120분)

