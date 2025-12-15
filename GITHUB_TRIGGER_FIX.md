# GitHub 트리거 생성 오류 해결 방법

## 문제
Cloud Console에서 트리거를 생성할 때 서비스 계정 권한 오류가 발생합니다.

## 해결 방법

### 방법 1: Cloud Console에서 서비스 계정 필드 비우기

1. [Cloud Build 트리거 페이지](https://console.cloud.google.com/cloud-build/triggers?project=open-calendar-481005) 접속
2. **트리거 만들기** 클릭
3. GitHub 저장소 연결 후 설정 진행:
   - **이름**: `calendar-backend-deploy`
   - **분기**: `main` (또는 사용 중인 브랜치)
   - **구성**: Cloud Build 구성 파일 (yaml 또는 json)
   - **위치**: `backend/cloudbuild.yaml`
   - **서비스 계정**: **비워두기** 또는 "Cloud Build 기본 서비스 계정 사용" 선택
4. **만들기** 클릭

---

### 방법 2: gcloud CLI 사용 (권장)

서비스 계정 오류를 우회하여 CLI로 트리거를 생성합니다.

#### 2-1. GitHub 저장소 정보 확인

먼저 GitHub 저장소 URL을 확인하세요:
- 예: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

#### 2-2. 트리거 생성

PowerShell에서 실행:

```powershell
# GitHub 저장소 정보 설정
$REPO_OWNER = "YOUR_GITHUB_USERNAME"  # GitHub 사용자명
$REPO_NAME = "YOUR_REPO_NAME"          # 저장소 이름

# 트리거 생성
gcloud builds triggers create github `
    --name="calendar-backend-deploy" `
    --region="asia-northeast3" `
    --repo-name="$REPO_NAME" `
    --repo-owner="$REPO_OWNER" `
    --branch-pattern="^main$" `
    --build-config="backend/cloudbuild.yaml" `
    --description="Deploy calendar backend to Cloud Run"
```

> **참고**: `YOUR_GITHUB_USERNAME`과 `YOUR_REPO_NAME`을 실제 값으로 변경하세요.

---

### 방법 3: GitHub 연결 확인 및 재연결

GitHub 연결 자체에 문제가 있을 수 있습니다.

1. [Cloud Build 설정](https://console.cloud.google.com/cloud-build/settings?project=open-calendar-481005) 접속
2. **GitHub 연결** 탭 확인
3. 연결이 없다면 **GitHub 연결** 클릭하여 재연결

---

## 트리거 생성 후 확인

트리거가 성공적으로 생성되면:

1. [Cloud Build 트리거 목록](https://console.cloud.google.com/cloud-build/triggers?project=open-calendar-481005)에서 확인
2. 테스트를 위해 GitHub에 코드 푸시:
   ```bash
   git add .
   git commit -m "Test auto deploy"
   git push origin main
   ```
3. [Cloud Build 히스토리](https://console.cloud.google.com/cloud-build/builds?project=open-calendar-481005)에서 빌드 확인

---

## 문제 해결

### 트리거가 생성되지 않음

- GitHub 저장소 이름과 소유자가 정확한지 확인
- GitHub 연결이 정상인지 확인
- `gcloud auth login`으로 로그인 상태 확인

### 빌드는 시작되지만 실패함

- `backend/cloudbuild.yaml` 파일이 올바른 경로에 있는지 확인
- Artifact Registry 저장소가 생성되어 있는지 확인
- Cloud Build 서비스 계정에 필요한 권한이 있는지 확인

---

## 현재 설정 상태

✅ Artifact Registry 저장소 생성됨  
✅ Cloud Build 서비스 계정 권한 설정됨  
⏳ GitHub 트리거 생성 필요

GitHub 저장소 정보를 알려주시면 정확한 명령어를 제공해드리겠습니다.

