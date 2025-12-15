# Azure App Service 마이그레이션 가이드

## 📋 개요

이 가이드는 Render에서 **Azure App Service**로 백엔드를 마이그레이션하는 단계별 가이드입니다.

**Azure App Service 장점:**
- ✅ Node.js 직접 지원 (Docker 불필요)
- ✅ 간단한 배포 (Git, GitHub, Azure DevOps)
- ✅ 자동 스케일링
- ✅ 서울 리전 지원 (`Korea Central`)
- ✅ 12개월 무료 티어 + $200 크레딧

---

## 🎯 사전 준비

### 1. Azure 계정 생성

1. [Azure Portal](https://portal.azure.com) 접속
2. 계정 생성 (12개월 무료 서비스 + $200 크레딧)
3. 구독 생성

### 2. Azure CLI 설치 및 설정

```bash
# Windows
winget install -e --id Microsoft.AzureCLI

# Mac
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 로그인
az login

# 구독 설정
az account list --output table
az account set --subscription "Your Subscription Name"
```

---

## 🚀 배포 단계

### 방법 1: Azure Portal 사용 (권장)

#### 1단계: App Service 생성

1. Azure Portal → **Create a resource**
2. **Web App** 검색 및 선택
3. **Create** 클릭

**기본 설정:**
- **Subscription**: 선택한 구독
- **Resource Group**: 새로 생성 또는 기존 그룹
- **Name**: `calendar-backend` (고유한 이름)
- **Publish**: Code
- **Runtime stack**: Node 18 LTS
- **Operating System**: Linux
- **Region**: **Korea Central** (중요!)
- **App Service Plan**: 새로 생성
  - **Plan name**: `calendar-backend-plan`
  - **Sku and size**: Free F1 (테스트용) 또는 Basic B1 (프로덕션)

4. **Review + create** → **Create**

#### 2단계: 배포 설정

**방법 A: GitHub 연동 (권장)**

1. App Service → **Deployment Center**
2. **Source**: GitHub 선택
3. GitHub 계정 연결
4. 리포지토리 및 브랜치 선택
5. **Save** 클릭

**빌드 설정:**
- **Build provider**: App Service build service
- **Configuration**: 다음으로 설정:
  ```
  Build Command: npm install && npm run prisma:generate
  Start Command: node src/server.js
  ```

**방법 B: 로컬에서 직접 배포**

```bash
# Azure CLI로 배포
cd backend

# 로그인 (이미 했다면 생략)
az login

# ZIP 파일 생성 및 배포
zip -r deploy.zip . -x "node_modules/*" ".git/*"
az webapp deployment source config-zip \
  --resource-group <RESOURCE_GROUP_NAME> \
  --name calendar-backend \
  --src deploy.zip
```

#### 3단계: 환경 변수 설정

1. App Service → **Configuration** → **Application settings**

**환경 변수 추가:**
- `NODE_ENV` = `production`
- `PORT` = `8080` (Azure가 자동 설정하지만 명시적으로 설정)
- `DATABASE_URL` = (Supabase 연결 문자열)
- `JWT_SECRET` = (JWT 시크릿)
- `CORS_ORIGIN` = (프론트엔드 URL)

**또는 Azure Key Vault 사용 (권장, 보안):**

```bash
# Key Vault 생성
az keyvault create \
  --name calendar-backend-kv \
  --resource-group <RESOURCE_GROUP_NAME> \
  --location koreacentral

# Secret 저장
az keyvault secret set \
  --vault-name calendar-backend-kv \
  --name DATABASE-URL \
  --value "your-database-url"

az keyvault secret set \
  --vault-name calendar-backend-kv \
  --name JWT-SECRET \
  --value "your-jwt-secret"

az keyvault secret set \
  --vault-name calendar-backend-kv \
  --name CORS-ORIGIN \
  --value "https://your-frontend.vercel.app"
```

App Service 설정에서:
- **Identity** → **System assigned** → **On** → **Save**
- Key Vault에 접근 권한 부여:
  ```bash
  az keyvault set-policy \
    --name calendar-backend-kv \
    --object-id <PRINCIPAL_ID> \
    --secret-permissions get list
  ```

#### 4단계: 시작 명령어 설정

1. App Service → **Configuration** → **General settings**
2. **Startup Command** 설정:
   ```
   node src/server.js
   ```

또는 `package.json`의 `start` 스크립트를 사용 (이미 설정되어 있음)

#### 5단계: 배포 확인

```bash
# URL 확인
az webapp show \
  --resource-group <RESOURCE_GROUP_NAME> \
  --name calendar-backend \
  --query defaultHostName \
  --output tsv

# Health check
curl https://calendar-backend.azurewebsites.net/health
```

---

### 방법 2: Azure CLI 사용

#### 1단계: 리소스 그룹 생성

```bash
az group create \
  --name calendar-backend-rg \
  --location koreacentral
```

#### 2단계: App Service Plan 생성

```bash
az appservice plan create \
  --name calendar-backend-plan \
  --resource-group calendar-backend-rg \
  --location koreacentral \
  --sku FREE
```

#### 3단계: Web App 생성

```bash
az webapp create \
  --resource-group calendar-backend-rg \
  --plan calendar-backend-plan \
  --name calendar-backend \
  --runtime "NODE:18-lts"
```

#### 4단계: 환경 변수 설정

```bash
az webapp config appsettings set \
  --resource-group calendar-backend-rg \
  --name calendar-backend \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    DATABASE_URL="your-database-url" \
    JWT_SECRET="your-jwt-secret" \
    CORS_ORIGIN="https://your-frontend.vercel.app"
```

#### 5단계: 배포

```bash
cd backend

# ZIP 배포
zip -r deploy.zip . -x "node_modules/*" ".git/*"
az webapp deployment source config-zip \
  --resource-group calendar-backend-rg \
  --name calendar-backend \
  --src deploy.zip
```

---

## 🔧 추가 설정

### Node.js 버전 확인

```bash
az webapp config show \
  --resource-group calendar-backend-rg \
  --name calendar-backend \
  --query linuxFxVersion

# Node.js 버전 변경 (필요 시)
az webapp config set \
  --resource-group calendar-backend-rg \
  --name calendar-backend \
  --linux-fx-version "NODE|18-lts"
```

### 포트 설정

Azure App Service는 자동으로 `PORT` 환경 변수를 제공하므로, 서버 코드가 `process.env.PORT`를 사용하면 자동으로 작동합니다.

현재 코드가 이미 이를 사용하고 있으므로 추가 설정 불필요! ✅

### Health check 설정

1. App Service → **Configuration** → **General settings**
2. **Health check path**: `/health`
3. **Save** 클릭

---

## 🌐 도메인 연결

### 커스텀 도메인 설정

1. App Service → **Custom domains**
2. **Add custom domain** 클릭
3. 도메인 입력 및 검증
4. DNS 설정 안내 확인

### SSL 인증서

1. **TLS/SSL settings** → **Private Key Certificates (.pfx)**
2. App Service Managed Certificate (무료) 또는 업로드
3. **Bindings**에서 HTTPS 바인딩 설정

---

## 📊 스케일링

### 수동 스케일링

1. App Service → **Scale up (App Service plan)**
2. 가격 책정 계층 선택:
   - **Free**: 개발/테스트용
   - **Basic**: 소규모 프로덕션
   - **Standard**: 중규모 프로덕션
   - **Premium**: 대규모 프로덕션

### 자동 스케일링

1. App Service → **Scale out (App Service plan)**
2. **Custom autoscale** 선택
3. 규칙 설정:
   - **Metric**: CPU Percentage
   - **Threshold**: 70%
   - **Instance count**: 1-10

---

## 💰 비용

### App Service 가격 (한국 중부 리전)

| 플랜 | 가격/월 | vCPU | RAM | 특징 |
|------|--------|------|-----|------|
| **Free (F1)** | 무료 | 공유 | 1 GB | 개발/테스트용 |
| **Basic B1** | 약 $13 | 1 | 1.75 GB | 소규모 프로덕션 |
| **Basic B2** | 약 $26 | 1 | 3.5 GB | 중소규모 |
| **Standard S1** | 약 $73 | 1 | 1.75 GB | 프로덕션 |
| **Standard S2** | 약 $146 | 2 | 3.5 GB | 중대규모 |

### 무료 티어

- **12개월 무료 서비스** (신규 계정)
- **$200 크레딧** (30일 동안 사용)

**권장**: 개발 단계에서는 **Free F1**, 프로덕션은 **Basic B1** 이상

---

## 🔄 CI/CD 설정

### GitHub Actions 사용

```yaml
# .github/workflows/deploy-azure.yml
name: Deploy to Azure App Service

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
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: calendar-backend
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ./backend
```

**GitHub Secrets 설정:**
1. Azure Portal → App Service → **Get publish profile**
2. 다운로드한 파일 내용을 GitHub Secrets에 `AZURE_WEBAPP_PUBLISH_PROFILE`로 저장

---

## 📈 모니터링 및 로깅

### Application Insights 연동

1. App Service → **Application Insights**
2. **Enable Application Insights** → **Create new resource**
3. **Apply** 클릭

### 로그 스트림

```bash
# 실시간 로그
az webapp log tail \
  --resource-group calendar-backend-rg \
  --name calendar-backend

# 로그 다운로드
az webapp log download \
  --resource-group calendar-backend-rg \
  --name calendar-backend \
  --log-file app-logs.zip
```

### Azure Portal에서 확인

- App Service → **Log stream**: 실시간 로그
- **Metrics**: CPU, Memory, Request Count 등
- **Application Insights**: 성능 모니터링

---

## 🆘 문제 해결

### 배포 실패

```bash
# 로그 확인
az webapp log tail --resource-group calendar-backend-rg --name calendar-backend

# 배포 상태 확인
az webapp deployment list-publishing-profiles \
  --resource-group calendar-backend-rg \
  --name calendar-backend
```

### 데이터베이스 연결 실패

- 환경 변수 `DATABASE_URL` 확인
- Key Vault 권한 확인 (사용하는 경우)

### 포트 오류

- `PORT` 환경 변수가 설정되어 있는지 확인
- 서버 코드가 `process.env.PORT`를 사용하는지 확인

### Prisma 클라이언트 생성 실패

- 배포 설정에서 빌드 명령어에 `npm run prisma:generate` 포함 확인

---

## ✅ 마이그레이션 체크리스트

- [ ] Azure 계정 생성 및 구독 설정
- [ ] Azure CLI 설치 및 로그인
- [ ] App Service 생성 (Korea Central 리전)
- [ ] 환경 변수 설정 (Key Vault 또는 직접)
- [ ] 시작 명령어 설정
- [ ] Health check 설정
- [ ] 배포 및 확인
- [ ] 프론트엔드에서 API 연결 테스트
- [ ] 로그 및 모니터링 확인
- [ ] 성능 테스트
- [ ] Vercel 환경 변수 업데이트
- [ ] Render 서비스 종료 (선택)

---

## 📚 참고 자료

- [App Service 공식 문서](https://docs.microsoft.com/azure/app-service/)
- [App Service 가격](https://azure.microsoft.com/pricing/details/app-service/linux/)
- [Azure Key Vault 가이드](https://docs.microsoft.com/azure/key-vault/)
- [Node.js 배포 가이드](https://docs.microsoft.com/azure/app-service/quickstart-nodejs)

---

## 🎉 완료!

이제 백엔드가 Azure App Service의 한국 중부 리전에서 실행되고 있습니다!

**예상 성능 개선:**
- Render (싱가폴) → App Service (서울): 약 50-100ms 지연 감소
- Vercel (서울) ↔ App Service (서울): 약 10-20ms (이전 50-100ms에서 대폭 개선)

