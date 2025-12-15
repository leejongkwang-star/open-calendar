# AWS App Runner 마이그레이션 가이드

## 📋 개요

이 가이드는 Render에서 **AWS App Runner**로 백엔드를 마이그레이션하는 단계별 가이드입니다.

**AWS App Runner 장점:**
- ✅ Docker 기반 배포 (간단)
- ✅ 자동 스케일링
- ✅ AWS 인프라의 안정성
- ✅ 서울 리전 지원 (`ap-northeast-2`)
- ✅ 12개월 무료 티어

---

## 🎯 사전 준비

### 1. AWS 계정 생성

1. [AWS Console](https://aws.amazon.com/ko/console/) 접속
2. 계정 생성 (무료 티어 12개월)
3. IAM 사용자 생성 (관리자 권한)

### 2. AWS CLI 설치 및 설정

```bash
# Windows (Chocolatey)
choco install awscli

# Mac
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 설정
aws configure
# AWS Access Key ID 입력
# AWS Secret Access Key 입력
# Default region: ap-northeast-2
# Default output format: json
```

---

## 📦 Dockerfile 생성

App Runner는 Docker 컨테이너를 사용합니다.

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

# 포트 노출
EXPOSE 8080

# 헬스 체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
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

## 🚀 배포 단계

### 방법 1: AWS Console 사용 (권장)

#### 1단계: ECR 리포지토리 생성

1. AWS Console → ECR (Elastic Container Registry)
2. **Create repository** 클릭
3. Repository name: `calendar-backend`
4. Visibility: Private
5. **Create repository** 클릭

#### 2단계: Docker 이미지 빌드 및 푸시

```bash
cd backend

# AWS ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com

# ECR URI 확인 (AWS Console에서 복사)
ECR_URI=<AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com/calendar-backend

# Docker 이미지 빌드
docker build -t calendar-backend .

# 태그 설정
docker tag calendar-backend:latest $ECR_URI:latest

# ECR에 푸시
docker push $ECR_URI:latest
```

#### 3단계: App Runner 서비스 생성

1. AWS Console → App Runner
2. **Create service** 클릭
3. **Source type**: Container registry
4. **Container image URI**: 위에서 푸시한 ECR URI 입력
5. **Deployment trigger**: Manual (또는 Automatic)
6. **Service name**: `calendar-backend`
7. **Virtual CPU**: 1 vCPU
8. **Memory**: 2 GB

#### 4단계: 환경 변수 설정

**Configure service** 섹션에서:
- **Environment variables** 추가:
  - `NODE_ENV` = `production`
  - `DATABASE_URL` = (Supabase 연결 문자열)
  - `JWT_SECRET` = (JWT 시크릿)
  - `CORS_ORIGIN` = (프론트엔드 URL)
  - `PORT` = `8080`

**또는 AWS Systems Manager Parameter Store 사용 (권장):**

```bash
# Parameter Store에 저장
aws ssm put-parameter \
  --name /calendar-backend/DATABASE_URL \
  --value "your-database-url" \
  --type SecureString \
  --region ap-northeast-2

aws ssm put-parameter \
  --name /calendar-backend/JWT_SECRET \
  --value "your-jwt-secret" \
  --type SecureString \
  --region ap-northeast-2

aws ssm put-parameter \
  --name /calendar-backend/CORS_ORIGIN \
  --value "https://your-frontend.vercel.app" \
  --type String \
  --region ap-northeast-2
```

App Runner 설정에서:
- **Environment variables**:
  - `DATABASE_URL` = `{{resolve:ssm:/calendar-backend/DATABASE_URL}}`
  - `JWT_SECRET` = `{{resolve:ssm:/calendar-backend/JWT_SECRET}}`
  - `CORS_ORIGIN` = `{{resolve:ssm:/calendar-backend/CORS_ORIGIN}}`

#### 5단계: Health check 설정

- **Health check path**: `/health`
- **Health check interval**: 10 seconds
- **Health check timeout**: 5 seconds
- **Healthy threshold**: 1
- **Unhealthy threshold**: 5

#### 6단계: 서비스 생성 및 배포

1. **Create & deploy** 클릭
2. 배포 완료 대기 (약 5-10분)
3. 서비스 URL 확인

---

### 방법 2: AWS CLI 사용

#### 1단계: `apprunner.yaml` 생성

```yaml
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "No build commands needed"
run:
  runtime-version: 18
  command: node src/server.js
  network:
    port: 8080
    env: PORT
  env:
    - name: NODE_ENV
      value: production
```

#### 2단계: App Runner 서비스 생성

```bash
# apprunner-service-config.json 생성
cat > apprunner-service-config.json << EOF
{
  "ServiceName": "calendar-backend",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$ECR_URI:latest",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production",
          "PORT": "8080"
        },
        "RuntimeEnvironmentSecrets": {
          "DATABASE_URL": "arn:aws:ssm:ap-northeast-2:<ACCOUNT_ID>:parameter/calendar-backend/DATABASE_URL",
          "JWT_SECRET": "arn:aws:ssm:ap-northeast-2:<ACCOUNT_ID>:parameter/calendar-backend/JWT_SECRET"
        }
      }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

# 서비스 생성
aws apprunner create-service \
  --cli-input-json file://apprunner-service-config.json \
  --region ap-northeast-2
```

---

## 🔐 IAM 역할 설정

App Runner가 ECR과 Parameter Store에 접근하려면 IAM 역할이 필요합니다.

### 자동 생성된 역할 확인

App Runner 서비스 생성 시 자동으로 IAM 역할이 생성됩니다:
- 역할 이름: `AppRunnerServiceRole-<SERVICE_NAME>`

### 수동 권한 추가 (필요 시)

```bash
# Parameter Store 접근 권한 추가
aws iam attach-role-policy \
  --role-name AppRunnerServiceRole-calendar-backend \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess
```

---

## 🌐 도메인 연결

### 커스텀 도메인 설정

1. AWS Console → App Runner → calendar-backend
2. **Custom domains** 탭
3. **Add domain** 클릭
4. 도메인 입력 및 DNS 설정 안내 확인
5. Route 53 또는 외부 DNS에서 CNAME 레코드 추가

---

## 📊 리소스 할당

App Runner 설정에서:

- **CPU**: 0.25 vCPU, 0.5 vCPU, 1 vCPU, 2 vCPU, 4 vCPU
- **Memory**: 0.5 GB ~ 12 GB
- **Auto scaling**: 
  - Min concurrency: 1
  - Max concurrency: 100

권장 설정:
- **CPU**: 1 vCPU
- **Memory**: 2 GB
- **Min concurrency**: 10
- **Max concurrency**: 50

---

## 💰 비용

### App Runner 가격 (서울 리전)

- **vCPU**: $0.007/vCPU-시간
- **Memory**: $0.0008/GB-시간
- **요청**: 무료

**예상 월 비용:**
- 1 vCPU, 2 GB, 24/7 운영: 약 $15-20/월

### 무료 티어

- 12개월 무료 티어 제공 (신규 계정)
- EC2 t2.micro 또는 t3.micro (750시간/월)

---

## 🔄 자동 배포 설정

### ECR과 App Runner 연동

1. App Runner 서비스 설정에서:
   - **Deployment trigger**: Automatic
   - ECR 이미지 업데이트 시 자동 배포

### GitHub Actions 사용 (CI/CD)

```yaml
# .github/workflows/deploy-aws.yml
name: Deploy to AWS App Runner

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        run: |
          docker build -t calendar-backend ./backend
          docker tag calendar-backend:latest $ECR_URI:latest
          docker push $ECR_URI:latest
        env:
          ECR_URI: ${{ secrets.AWS_ECR_URI }}
      
      - name: Trigger App Runner deployment
        run: |
          aws apprunner start-deployment \
            --service-arn ${{ secrets.AWS_APP_RUNNER_SERVICE_ARN }} \
            --region ap-northeast-2
```

---

## 📈 모니터링 및 로깅

### CloudWatch 로그 확인

```bash
# 로그 그룹 확인
aws logs describe-log-groups --region ap-northeast-2

# 로그 확인
aws logs tail /aws/apprunner/calendar-backend --follow --region ap-northeast-2
```

### CloudWatch 메트릭

- AWS Console → CloudWatch → Metrics
- App Runner 네임스페이스에서 확인:
  - ActiveInstances
  - Requests
  - ResponseTime
  - CPUUtilization
  - MemoryUtilization

---

## 🆘 문제 해결

### 배포 실패

```bash
# 로그 확인
aws logs tail /aws/apprunner/calendar-backend --follow

# 서비스 상태 확인
aws apprunner describe-service \
  --service-arn <SERVICE_ARN> \
  --region ap-northeast-2
```

### 데이터베이스 연결 실패

- Parameter Store의 `DATABASE_URL` 확인
- IAM 역할에 Parameter Store 읽기 권한 확인

### Health check 실패

- `/health` 엔드포인트가 정상 작동하는지 확인
- Health check 설정 확인 (경로, 타임아웃)

---

## ✅ 마이그레이션 체크리스트

- [ ] AWS 계정 생성 및 CLI 설정
- [ ] ECR 리포지토리 생성
- [ ] Dockerfile 생성 및 테스트
- [ ] Docker 이미지 빌드 및 ECR 푸시
- [ ] App Runner 서비스 생성
- [ ] 환경 변수 설정 (Parameter Store 또는 직접)
- [ ] Health check 통과 확인
- [ ] 프론트엔드에서 API 연결 테스트
- [ ] CloudWatch 로그 및 메트릭 확인
- [ ] 성능 테스트
- [ ] Vercel 환경 변수 업데이트
- [ ] Render 서비스 종료 (선택)

---

## 📚 참고 자료

- [App Runner 공식 문서](https://docs.aws.amazon.com/apprunner/)
- [App Runner 가격](https://aws.amazon.com/apprunner/pricing/)
- [ECR 가이드](https://docs.aws.amazon.com/ecr/)
- [Parameter Store 가이드](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)

---

## 🎉 완료!

이제 백엔드가 AWS App Runner의 서울 리전에서 실행되고 있습니다!

**예상 성능 개선:**
- Render (싱가폴) → App Runner (서울): 약 50-100ms 지연 감소
- Vercel (서울) ↔ App Runner (서울): 약 10-20ms (이전 50-100ms에서 대폭 개선)

