# 배포 가이드 (Deployment Guide)

**작성일**: 2025-12-19  
**프로젝트**: 팀 캘린더 애플리케이션

---

## 📋 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [배포 전 준비사항](#배포-전-준비사항)
3. [프론트엔드 배포](#프론트엔드-배포)
4. [백엔드 배포](#백엔드-배포)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [환경 변수 설정](#환경-변수-설정)
7. [배포 플랫폼별 가이드](#배포-플랫폼별-가이드)
8. [배포 후 확인사항](#배포-후-확인사항)

---

## 🏗️ 프로젝트 구조

```
open-calendar-app/
├── frontend/    # React + Vite 프론트엔드
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── backend/        # Node.js + Express 백엔드
│   ├── src/
│   ├── prisma/
│   └── package.json
└── DEPLOYMENT_GUIDE.md  # 이 파일
```

---

## ✅ 배포 전 준비사항

### 1. 코드 최종 확인
- [ ] 모든 기능이 정상 작동하는지 확인
- [ ] 테스트 완료
- [ ] 버그 리포트 확인 및 수정 완료

### 2. 환경 변수 준비
- [ ] 데이터베이스 연결 문자열 (Supabase 또는 PostgreSQL)
- [ ] JWT Secret 키 (강력한 랜덤 문자열)
- [ ] CORS Origin (프론트엔드 배포 URL)
- [ ] 백엔드 API URL

### 3. 데이터베이스 준비
- [ ] Supabase 프로젝트 생성 또는 PostgreSQL 서버 준비
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 초기 데이터 시드 (선택사항)

---

## 🎨 프론트엔드 배포

### 1. 프로덕션 빌드

```bash
cd frontend
npm install
npm run build
```

빌드 완료 후 `dist/` 폴더가 생성됩니다.

### 2. 환경 변수 설정

프로덕션 환경 변수 파일 생성 (`.env.production` 또는 배포 플랫폼 환경 변수 설정):

```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

**중요**: Vite는 빌드 시점에 환경 변수를 번들에 포함하므로, 배포 전에 올바른 값을 설정해야 합니다.

### 3. 빌드 결과 확인

```bash
npm run preview
```

로컬에서 빌드 결과를 확인할 수 있습니다.

---

## 🔧 백엔드 배포

### 1. 프로덕션 준비

```bash
cd backend
npm install --production
```

### 2. Prisma 클라이언트 생성

```bash
npm run prisma:generate
```

### 3. 환경 변수 설정

`.env` 파일 생성 (프로덕션 환경):

```env
PORT=3001
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-strong-random-secret-key"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="https://your-frontend-domain.com"
```

**JWT_SECRET 생성 방법:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 4. 데이터베이스 마이그레이션

```bash
# Prisma 마이그레이션 (프로덕션)
npx prisma migrate deploy
```

---

## 🗄️ 데이터베이스 설정

### Supabase 사용 (권장)

1. **프로젝트 생성**
   - [Supabase](https://supabase.com) 접속
   - New Project 생성
   - Database Password 설정 (중요: 저장 필수!)

2. **연결 문자열 가져오기**
   - Settings → Database → Connection string
   - URI 탭 선택
   - Pooler mode (포트 6543) 권장

3. **스키마 마이그레이션**
   - Supabase SQL Editor에서 `prisma/schema.prisma` 기반으로 테이블 생성
   - 또는 Prisma Migrate 사용

### 로컬 PostgreSQL 사용

1. PostgreSQL 서버 설치 및 실행
2. 데이터베이스 생성
3. 연결 문자열 설정

---

## 🔐 환경 변수 설정

### 프론트엔드 환경 변수

**파일**: `.env.production` 또는 배포 플랫폼 환경 변수

```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### 백엔드 환경 변수

**파일**: `.env`

```env
# 서버 설정
PORT=3001
NODE_ENV=production

# 데이터베이스
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# JWT 설정
JWT_SECRET="your-strong-random-secret-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# CORS 설정
CORS_ORIGIN="https://your-frontend-domain.com"
```

---

## 🚀 배포 플랫폼별 가이드

### ⭐ 권장 구성: Vercel (프론트엔드) + Render (백엔드)

**이 프로젝트는 Vercel(프론트엔드) + Render(백엔드) 조합으로 배포합니다.**

#### 프론트엔드 (Vercel)

1. **Vercel 계정 생성**
   - [Vercel](https://vercel.com) 접속 및 가입

2. **프로젝트 배포**
   ```bash
   # Vercel CLI 설치
   npm i -g vercel
   
   # 배포
   cd frontend
   vercel
   ```

3. **환경 변수 설정**
   - Vercel 대시보드 → Project Settings → Environment Variables
   - `VITE_API_BASE_URL` 추가

4. **빌드 설정**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

#### 백엔드 (Render)

1. **Render 계정 생성**
   - [Render](https://render.com) 접속 및 가입
   - GitHub 계정으로 로그인 (권장)

2. **프로젝트 배포**
   - **New** → **Web Service** 클릭
   - **Connect GitHub** 클릭
   - 리포지토리 선택 및 연결
   - **서비스 설정**:
     - **Name**: `calendar-backend` (또는 원하는 이름)
     - **Region**: 가장 가까운 지역 선택 (예: Singapore)
     - **Branch**: `main` (또는 기본 브랜치)
     - **Root Directory**: `backend`
     - **Build Command**: `npm install && npm run prisma:generate`
     - **Start Command**: `npm start`

3. **환경 변수 설정**
   - **Environment Variables** 섹션에서 다음 변수 추가:
     - `NODE_ENV` = `production`
     - `PORT` = `3001`
     - `DATABASE_URL` = (Supabase 연결 문자열)
     - `JWT_SECRET` = (강력한 랜덤 문자열, 32자 이상)
     - `JWT_EXPIRES_IN` = `7d`
     - `CORS_ORIGIN` = (Vercel 프론트엔드 URL, 예: `https://your-frontend.vercel.app`)

4. **Create Web Service** 클릭

5. **Prisma 마이그레이션**
   - 배포 완료 후 Render 대시보드 → **Shell** 탭
   - 다음 명령어 실행:
   ```bash
   npx prisma migrate deploy
   ```

**자세한 내용은 [`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md) 파일을 참고하세요.**

---

### 기타 옵션 (참고용)

#### 옵션 2: Netlify (프론트엔드) + Render (백엔드)

#### 프론트엔드 (Netlify)

1. **Netlify 계정 생성**
   - [Netlify](https://netlify.com) 접속 및 가입

2. **프로젝트 배포**
   - Sites → Add new site → Deploy manually
   - `frontend/dist` 폴더 드래그 앤 드롭

3. **환경 변수 설정**
   - Site settings → Environment variables
   - `VITE_API_BASE_URL` 추가

#### 백엔드 (Render)

**참고**: Render 사용 방법은 위의 "권장 구성" 섹션을 참고하세요.

#### 기타 백엔드 옵션 (Heroku 예시)

1. **Heroku 계정 생성**
   - [Heroku](https://heroku.com) 접속 및 가입

2. **Heroku CLI 설치 및 로그인**
   ```bash
   heroku login
   ```

3. **프로젝트 배포**
   ```bash
   cd backend
   heroku create your-app-name
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a your-app-name
   git push heroku main
   ```

4. **환경 변수 설정**
   ```bash
   heroku config:set DATABASE_URL="your-database-url"
   heroku config:set JWT_SECRET="your-jwt-secret"
   heroku config:set CORS_ORIGIN="https://your-frontend.netlify.app"
   heroku config:set NODE_ENV=production
   ```

5. **Prisma 마이그레이션**
   ```bash
   heroku run npm run prisma:generate
   heroku run npx prisma migrate deploy
   ```

---

### 옵션 3: 단일 서버 배포 (VPS/클라우드 서버)

#### 서버 요구사항
- Node.js 18+ 설치
- PostgreSQL 또는 Supabase 사용
- PM2 (프로세스 관리자) 권장

#### 배포 단계

1. **서버 접속 및 준비**
   ```bash
   # Node.js 설치 (Ubuntu 예시)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PM2 설치
   sudo npm install -g pm2
   ```

2. **프로젝트 업로드**
   ```bash
   # Git 사용
   git clone your-repository
   cd open-calendar-app
   
   # 또는 SCP로 파일 업로드
   scp -r ./frontend user@server:/var/www/
   scp -r ./backend user@server:/var/www/
   ```

3. **프론트엔드 빌드 및 배포**
   ```bash
   cd /var/www/frontend
   npm install
   npm run build
   
   # Nginx 설정 (예시)
   sudo cp -r dist/* /var/www/html/
   ```

4. **백엔드 배포**
   ```bash
   cd /var/www/backend
   npm install --production
   npm run prisma:generate
   npx prisma migrate deploy
   
   # PM2로 실행
   pm2 start src/server.js --name calendar-api
   pm2 save
   pm2 startup
   ```

5. **Nginx 설정** (프론트엔드 + 리버스 프록시)

   `/etc/nginx/sites-available/calendar`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 프론트엔드
       root /var/www/html;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # 백엔드 API 프록시
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   활성화:
   ```bash
   sudo ln -s /etc/nginx/sites-available/calendar /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## ✅ 배포 후 확인사항

### 1. 프론트엔드 확인
- [ ] 웹사이트 접속 가능
- [ ] 로그인 화면 표시
- [ ] API 연결 확인 (브라우저 개발자 도구 Network 탭)

### 2. 백엔드 확인
- [ ] API 엔드포인트 응답 확인
   ```bash
   curl https://your-backend-api.com/api/health
   ```
- [ ] 데이터베이스 연결 확인
- [ ] CORS 설정 확인

### 3. 기능 테스트
- [ ] 회원가입/로그인
- [ ] 일정 생성/수정/삭제
- [ ] 팀 관리 (관리자)
- [ ] 필터링 기능

### 4. 보안 확인
- [ ] HTTPS 사용 (SSL 인증서)
- [ ] 환경 변수 노출되지 않음
- [ ] JWT Secret 강력함
- [ ] CORS 올바르게 설정

---

## 🔒 보안 체크리스트

- [ ] `JWT_SECRET` 강력한 랜덤 문자열 (최소 32자)
- [ ] `DATABASE_URL` 안전하게 저장 (환경 변수)
- [ ] CORS Origin 정확히 설정
- [ ] HTTPS 사용 (프로덕션)
- [ ] `.env` 파일 `.gitignore`에 포함
- [ ] 민감한 정보 커밋하지 않음

---

## 📝 배포 체크리스트

### 배포 전
- [ ] 코드 최종 테스트 완료
- [ ] 환경 변수 준비 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 빌드 성공 확인

### 배포 중
- [ ] 프론트엔드 빌드 및 배포
- [ ] 백엔드 배포
- [ ] 환경 변수 설정
- [ ] 데이터베이스 마이그레이션 실행

### 배포 후
- [ ] 웹사이트 접속 확인
- [ ] API 연결 확인
- [ ] 기능 테스트
- [ ] 성능 모니터링

---

## 🆘 문제 해결

### 프론트엔드 빌드 오류
- Node.js 버전 확인 (18+)
- 의존성 재설치: `rm -rf node_modules package-lock.json && npm install`
- 캐시 클리어: `npm run build -- --force`

### 백엔드 연결 오류
- 환경 변수 확인
- 데이터베이스 연결 확인
- 포트 충돌 확인
- 로그 확인: `pm2 logs` 또는 배포 플랫폼 로그

### CORS 오류
- `CORS_ORIGIN` 환경 변수 확인
- 프론트엔드 URL과 정확히 일치하는지 확인
- 백엔드 CORS 설정 확인

---

## 📚 추가 리소스

- [Vercel 배포 가이드](https://vercel.com/docs)
- [Railway 배포 가이드](https://docs.railway.app)
- [Netlify 배포 가이드](https://docs.netlify.com)
- [Heroku 배포 가이드](https://devcenter.heroku.com)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)

---

## 💡 추천 배포 구성

### ⭐ 본 프로젝트 배포 구성 (권장)
- **프론트엔드**: Vercel (무료)
- **백엔드**: Render (무료 티어)
- **데이터베이스**: Supabase (무료)

### 기타 무료 옵션 (참고용)
- **프론트엔드**: Vercel (무료) 또는 Netlify (무료)
- **백엔드**: Railway (무료 티어) 또는 Render (무료 티어)
- **데이터베이스**: Supabase (무료)

### 프로덕션 (중소규모)
- **프론트엔드**: Vercel Pro 또는 Netlify Pro
- **백엔드**: Railway 또는 AWS EC2
- **데이터베이스**: Supabase Pro 또는 AWS RDS

### 엔터프라이즈
- **프론트엔드**: AWS S3 + CloudFront 또는 Vercel Enterprise
- **백엔드**: AWS ECS/EKS 또는 Kubernetes
- **데이터베이스**: AWS RDS 또는 자체 PostgreSQL 서버

---

**배포 성공을 기원합니다! 🚀**

