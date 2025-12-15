# IAM 권한 분석 및 권장사항

## 현재 권한 상태

### Compute Engine 기본 서비스 계정
**계정**: `750665560932-compute@developer.gserviceaccount.com`

**현재 역할**:
- ✅ `roles/cloudbuild.builds.editor` - 트리거 생성/관리 (필수)
- ✅ `roles/cloudbuild.builds.builder` - 빌드 실행 (필수)
- ✅ `roles/run.admin` - Cloud Run 배포 (필수)
- ✅ `roles/artifactregistry.writer` - 이미지 푸시 (필수)
- ✅ `roles/iam.serviceAccountUser` - 서비스 계정 사용 (필수)
- ⚠️ `roles/editor` - **너무 광범위한 권한** (선택사항, 보안상 권장하지 않음)

### Cloud Build 기본 서비스 계정
**계정**: `750665560932@cloudbuild.gserviceaccount.com`

**현재 역할**:
- ✅ `roles/cloudbuild.builds.builder` - 빌드 실행
- ✅ `roles/run.admin` - Cloud Run 배포
- ✅ `roles/artifactregistry.writer` - 이미지 푸시
- ✅ `roles/iam.serviceAccountUser` - 서비스 계정 사용

---

## 권한 평가

### ✅ 충분한 권한
모든 필요한 권한이 부여되어 있습니다:
- Cloud Build 트리거 생성: ✅
- 빌드 실행: ✅
- Artifact Registry 푸시: ✅
- Cloud Run 배포: ✅

### ⚠️ 권장 사항

#### 1. Editor 역할 제거 (보안 개선)
`roles/editor`는 너무 광범위한 권한입니다. 제거해도 필요한 작업은 모두 수행 가능합니다:

```powershell
# Editor 역할 제거 (선택사항, 보안 강화)
gcloud projects remove-iam-policy-binding open-calendar-481005 `
    --member="serviceAccount:750665560932-compute@developer.gserviceaccount.com" `
    --role="roles/editor"
```

#### 2. Cloud Build 서비스 계정 사용 권장
트리거 생성 시 **Cloud Build 기본 서비스 계정**을 사용하는 것이 더 안전합니다:
- `750665560932@cloudbuild.gserviceaccount.com`

---

## 문제 해결

### Cloud Build 트리거 생성 오류

권한은 충분하지만, 다음을 확인하세요:

#### 방법 1: 서비스 계정 필드 비우기
트리거 생성 시:
- **서비스 계정 필드를 비워두기** (기본 Cloud Build 서비스 계정 사용)

#### 방법 2: Cloud Build 서비스 계정 명시
트리거 생성 시:
- **서비스 계정**: `750665560932@cloudbuild.gserviceaccount.com` 입력

#### 방법 3: GitHub 연결 재확인
GitHub 연결 자체에 문제가 있을 수 있습니다:
1. [Cloud Build 연결 설정](https://console.cloud.google.com/cloud-build/connections?project=open-calendar-481005)
2. 기존 연결 삭제 후 재생성

---

## 권한 요약

| 작업 | Compute Engine SA | Cloud Build SA | 상태 |
|------|------------------|----------------|------|
| 트리거 생성 | ✅ | - | 충분 |
| 빌드 실행 | ✅ | ✅ | 충분 |
| 이미지 푸시 | ✅ | ✅ | 충분 |
| Cloud Run 배포 | ✅ | ✅ | 충분 |

---

## 최종 권장사항

1. **권한은 충분함** - 추가 권한 부여 불필요
2. **Editor 역할 제거 고려** - 보안 강화
3. **GitHub Actions 사용 고려** - Cloud Build 트리거 오류 우회
4. **서비스 계정 필드 비우기** - 기본 Cloud Build 서비스 계정 사용

---

## 다음 단계

권한 문제가 아니라면:
1. GitHub 연결 상태 확인
2. API 활성화 상태 확인
3. 또는 GitHub Actions 방식 사용 (권장)

