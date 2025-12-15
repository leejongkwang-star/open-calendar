# GitHub 연결 가이드

## 현재 상황
GitHub 저장소와 Google Cloud Build를 연결해야 트리거를 생성할 수 있습니다.

## 해결 방법

### 방법 1: Cloud Console에서 연결 (가장 쉬움, 권장)

1. **[Cloud Build 연결 설정 페이지](https://console.cloud.google.com/cloud-build/connections?project=open-calendar-481005)** 접속

2. **연결 만들기** 클릭

3. **GitHub** 선택

4. **GitHub App 설치** 클릭
   - GitHub에 로그인
   - 저장소 선택: `leejongkwang-star/open-calendar`
   - GitHub App 설치 승인

5. 연결 이름 입력: `github-connection`

6. **만들기** 클릭

7. 연결이 완료되면 **트리거 만들기**로 진행:
   - 이름: `calendar-backend-deploy`
   - 저장소: `leejongkwang-star/open-calendar` 선택
   - 분기: `main`
   - 구성: Cloud Build 구성 파일
   - 위치: `backend/cloudbuild.yaml`
   - **서비스 계정**: 비워두기 (기본값 사용)

---

### 방법 2: CLI로 연결 (고급)

먼저 Cloud Build Connections API를 활성화해야 합니다:

```powershell
# API 활성화
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sourcerepo.googleapis.com
gcloud services enable developerconnect.googleapis.com

# GitHub 연결 생성
gcloud builds connections create github github-connection `
    --region=asia-northeast3 `
    --authorizer-token="YOUR_GITHUB_TOKEN"
```

그런 다음 GitHub App 설치가 필요합니다.

---

## 권장 순서

1. **Cloud Console에서 GitHub 연결** (방법 1)
2. 연결 완료 후 **트리거 생성**
3. 서비스 계정 필드는 **비워두기**

---

## 문제 해결

### "권한이 부족합니다" 오류
- Cloud Console에서 연결하면 사용자 계정 권한으로 연결되므로 서비스 계정 오류를 피할 수 있습니다.

### GitHub App 설치 안 됨
- GitHub에서 Google Cloud Build App을 승인했는지 확인
- 저장소 접근 권한이 있는지 확인

---

**다음 단계**: Cloud Console에서 GitHub 연결을 먼저 진행해주세요.

