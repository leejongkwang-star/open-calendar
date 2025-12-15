# Google Cloud Run 마이그레이션 가이드

## 📋 개요

이 가이드는 Render에서 **Google Cloud Run**으로 백엔드를 마이그레이션하는 단계별 가이드입니다.

**Google Cloud Run 장점:**
- ✅ 완전 서버리스 (사용한 만큼만 과금)
- ✅ 자동 스케일링 (0개부터 수천 개까지)
- ✅ Docker 기반 배포
- ✅ 서울 리전 지원 (`asia-northeast3`)
- ✅ 무료 티어: 월 200만 요청

---

## 🎯 사전 준비

### 1. Google Cloud 계정 생성

1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 계정 생성 (무료 크레딧 $300 제공)
3. 프로젝트 생성
4. 결제 정보 등록 (무료 티어 사용 시에도 필요)

### 2. 필수 도구 설치

```bash
# Google Cloud CLI 설치
# Windows
choco install gcloudsdk

# Mac
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# 로그인 및 초기화
gcloud init
gcloud auth login
```

### 3. 프로젝트 설정

```bash
# 프로젝트 ID 확인 (Google Cloud Console에서 생성)
export PROJECT_ID="your-project-id"

# 프로젝트 설정
gcloud config set project $PROJECT_ID

# 서울 리전 설정
gcloud config set run/region asia-northeast3
```

---

## 📦 Dockerfile 생성

Cloud Run은 Docker 컨테이너를 사용하므로 Dockerfile이 필요합니다.

### `backend/Dockerfile` 생성

```dockerfile
# Node.js 18 LTS 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# Prisma 클라이언트 생성
RUN npx prisma generate

# 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=8080

# 포트 노출 (Cloud Run은 PORT 환경 변수 사용)
EXPOSE 8080

# 헬스 체크 추가 (선택사항)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 서버 시작
CMD ["node", "src/server.js"]
```

### `backend/.dockerignore` 생성

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
.DS_Store
*.log
```

---

## 🔧 서버 코드 수정

Cloud Run은 `PORT` 환경 변수를 사용하므로, 서버가 이를 읽도록 해야 합니다.

### `backend/src/server.js` 확인

현재 코드가 이미 `process.env.PORT`를 사용하고 있는지 확인:

```javascript
const PORT = process.env.PORT || 3001
```

이미 구현되어 있으므로 추가 수정 불필요합니다! ✅

---

## 🚀 배포 단계

### 방법 1: Google Cloud CLI 사용 (권장)

#### 1단계: Docker 이미지 빌드 및 배포

```bash
cd backend

# Docker 이미지 빌드
docker build -t gcr.io/$PROJECT_ID/calendar-backend:latest .

# Google Container Registry에 푸시
gcloud builds submit --tag gcr.io/$PROJECT_ID/calendar-backend:latest

# Cloud Run에 배포
gcloud run deploy calendar-backend \
  --image gcr.io/$PROJECT_ID/calendar-backend:latest \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,CORS_ORIGIN=CORS_ORIGIN:latest
```

#### 2단계: 환경 변수 설정

**방법 A: Secret Manager 사용 (권장, 보안)**

```bash
# Secret 생성
echo -n "your-database-url" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-jwt-secret" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "https://your-frontend.vercel.app" | gcloud secrets create CORS_ORIGIN --data-file=-

# Secret에 접근 권한 부여
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding CORS_ORIGIN \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**방법 B: 직접 환경 변수 설정 (간단)**

```bash
gcloud run services update calendar-backend \
  --region asia-northeast3 \
  --set-env-vars DATABASE_URL="your-database-url",JWT_SECRET="your-jwt-secret",CORS_ORIGIN="https://your-frontend.vercel.app",NODE_ENV="production"
```

#### 3단계: 배포 확인

```bash
# 서비스 URL 확인
gcloud run services describe calendar-backend --region asia-northeast3 --format="value(status.url)"

# Health check 테스트
curl https://your-service-url.run.app/health
```

---

### 방법 2: Cloud Build 사용 (CI/CD)

#### 1단계: `backend/cloudbuild.yaml` 생성

```yaml
steps:
  # Docker 이미지 빌드
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/calendar-backend:$SHORT_SHA', '.']
  
  # 이미지 푸시
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/calendar-backend:$SHORT_SHA']
  
  # Cloud Run에 배포
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'calendar-backend'
      - '--image=gcr.io/$PROJECT_ID/calendar-backend:$SHORT_SHA'
      - '--region=asia-northeast3'
      - '--platform=managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/calendar-backend:$SHORT_SHA'
```

#### 2단계: GitHub 연동

1. Google Cloud Console → Cloud Build → Triggers
2. **Create Trigger** 클릭
3. GitHub 리포지토리 연결
4. 빌드 설정:
   - **Configuration**: Cloud Build configuration file (yaml or json)
   - **Location**: `backend/cloudbuild.yaml`
5. **Create** 클릭

이제 GitHub에 푸시하면 자동으로 배포됩니다! ✅

---

## 🔐 환경 변수 관리

### Secret Manager 사용 (권장)

```bash
# Secret 생성
gcloud secrets create DATABASE_URL --data-file=<(echo -n "your-database-url")
gcloud secrets create JWT_SECRET --data-file=<(echo -n "your-jwt-secret")
gcloud secrets create CORS_ORIGIN --data-file=<(echo -n "https://your-frontend.vercel.app")

# Cloud Run 서비스에 Secret 마운트
gcloud run services update calendar-backend \
  --region asia-northeast3 \
  --update-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,CORS_ORIGIN=CORS_ORIGIN:latest
```

### 환경 변수 업데이트

```bash
gcloud run services update calendar-backend \
  --region asia-northeast3 \
  --update-env-vars KEY=value
```

---

## 📊 리소스 할당

Cloud Run은 자동 스케일링되지만, 리소스 제한을 설정할 수 있습니다.

```bash
gcloud run services update calendar-backend \
  --region asia-northeast3 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s
```

**설명:**
- `--memory`: 컨테이너 메모리 (256Mi, 512Mi, 1Gi, 2Gi, 4Gi, 8Gi)
- `--cpu`: CPU 할당 (1, 2, 4, 6, 8)
- `--min-instances`: 최소 인스턴스 수 (0 = 완전 서버리스)
- `--max-instances`: 최대 인스턴스 수
- `--timeout`: 요청 타임아웃 (최대 300초)

---

## 🌐 도메인 연결

### 커스텀 도메인 설정

1. Google Cloud Console → Cloud Run → calendar-backend
2. **Manage Custom Domains** 클릭
3. 도메인 추가 및 DNS 설정

### Vercel 프론트엔드 환경 변수 업데이트

```bash
# Vercel CLI로 환경 변수 설정
vercel env add VITE_API_BASE_URL production
# 값 입력: https://your-service-url.run.app/api
```

또는 Vercel 대시보드에서:
- Settings → Environment Variables
- `VITE_API_BASE_URL` = `https://your-service-url.run.app/api`

---

## 📈 모니터링 및 로깅

### 로그 확인

```bash
# 실시간 로그
gcloud run services logs tail calendar-backend --region asia-northeast3

# 특정 시간 범위 로그
gcloud run services logs read calendar-backend --region asia-northeast3 --limit 50
```

### Google Cloud Console에서 확인

- Cloud Run → calendar-backend → Logs 탭
- Metrics 탭에서 트래픽, 지연 시간, 오류율 확인

---

## 💰 비용 최적화

### 무료 티어 한도
- **월 200만 요청 무료**
- **월 360,000 GiB-초, 180,000 vCPU-초 무료**
- **월 2백만 요청 초과 시**: $0.40/100만 요청

### 비용 절감 팁

1. **최소 인스턴스 0 유지** (완전 서버리스)
2. **적절한 메모리 설정** (필요 이상으로 늘리지 않기)
3. **타임아웃 최적화** (불필요하게 길게 설정하지 않기)

---

## 🆘 문제 해결

### 배포 실패

```bash
# 로그 확인
gcloud run services logs read calendar-backend --region asia-northeast3 --limit 100

# 서비스 상태 확인
gcloud run services describe calendar-backend --region asia-northeast3
```

### 데이터베이스 연결 실패

- `DATABASE_URL` 환경 변수 확인
- Supabase 연결 문자열 형식 확인
- Cloud Run에서 Supabase로의 네트워크 경로 확인

### CORS 오류

- `CORS_ORIGIN` 환경 변수가 정확한지 확인
- 프론트엔드 URL과 정확히 일치하는지 확인

---

## ✅ 마이그레이션 체크리스트

- [ ] Google Cloud 계정 생성 및 프로젝트 설정
- [ ] Dockerfile 생성 및 테스트
- [ ] Cloud Run에 서비스 배포
- [ ] 환경 변수 설정 (Secret Manager 또는 직접)
- [ ] Health check 통과 확인
- [ ] 프론트엔드에서 API 연결 테스트
- [ ] 로그 및 모니터링 확인
- [ ] 성능 테스트
- [ ] Vercel 환경 변수 업데이트
- [ ] Render 서비스 종료 (선택)

---

## 📚 참고 자료

- [Cloud Run 공식 문서](https://cloud.google.com/run/docs)
- [Cloud Run 가격](https://cloud.google.com/run/pricing)
- [Secret Manager 가이드](https://cloud.google.com/secret-manager/docs)
- [Cloud Build 가이드](https://cloud.google.com/build/docs)

---

## 🎉 완료!

이제 백엔드가 Google Cloud Run의 서울 리전에서 실행되고 있습니다!

**예상 성능 개선:**
- Render (싱가폴) → Cloud Run (서울): 약 50-100ms 지연 감소
- Vercel (서울) ↔ Cloud Run (서울): 약 10-20ms (이전 50-100ms에서 대폭 개선)

