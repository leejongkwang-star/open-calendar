# Render 백엔드 배포 가이드

## 📋 배포 구성
- **백엔드**: Render (이 문서)
- **프론트엔드**: Vercel ([`VERCEL_DEPLOY.md`](./VERCEL_DEPLOY.md) 참고)

## ✅ 배포 준비 완료
- ✅ `render.yaml` 설정 파일 생성
- ✅ `Procfile` 생성 완료

---

## 🚀 Render 배포 단계

### 1. Render 계정 생성 및 로그인

1. [Render](https://render.com) 접속
2. **Sign Up** 또는 **Log In**
3. GitHub 계정으로 로그인 (권장)

---

### 2. 프로젝트 배포

#### 방법 A: GitHub 연동 (권장)

1. **GitHub에 프로젝트 푸시** (아직 안 했다면)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

2. **Render 대시보드에서 배포**
   - **New** → **Web Service** 클릭
   - **Connect GitHub** 클릭
   - 리포지토리 선택
   - **Connect** 클릭

3. **서비스 설정**
   - **Name**: `calendar-backend` (또는 원하는 이름)
   - **Region**: 가장 가까운 지역 선택 (예: Singapore)
   - **Branch**: `main` (또는 기본 브랜치)
   - **Root Directory**: `backend` (또는 `.`)

4. **빌드 및 시작 명령어**
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Start Command**: `npm start`

5. **환경 변수 설정**
   - **Environment Variables** 섹션에서 다음 변수 추가:
     - `NODE_ENV` = `production`
     - `PORT` = `3001`
     - `DATABASE_URL` = (Supabase 연결 문자열)
     - `JWT_SECRET` = (강력한 랜덤 문자열)
     - `JWT_EXPIRES_IN` = `7d`
     - `CORS_ORIGIN` = (프론트엔드 URL, 예: `https://your-frontend.vercel.app`)

6. **Create Web Service** 클릭

#### 방법 B: render.yaml 사용 (자동 설정)

1. GitHub에 `render.yaml` 파일이 포함된 프로젝트 푸시
2. Render 대시보드에서 **New** → **Blueprint**
3. GitHub 리포지토리 선택
4. Render가 자동으로 `render.yaml` 설정 읽음
5. 환경 변수만 수동으로 설정:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`

---

### 3. Prisma 마이그레이션 실행

배포 후 Render 대시보드에서:

1. **Shell** 탭 클릭
2. 다음 명령어 실행:
   ```bash
   npx prisma migrate deploy
   ```

또는 **Build Command**에 포함:
```bash
npm install && npm run prisma:generate && npx prisma migrate deploy
```

---

## 🔐 환경 변수 설정

### 필수 환경 변수

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Supabase 연결 문자열 |
| `JWT_SECRET` | 랜덤 문자열 (32자 이상) | JWT 토큰 암호화 키 |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | 프론트엔드 URL |
| `NODE_ENV` | `production` | 환경 설정 |
| `PORT` | `3001` | 포트 번호 (Render가 자동 설정) |
| `JWT_EXPIRES_IN` | `7d` | 토큰 만료 시간 |

### JWT_SECRET 생성 방법

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 📝 배포 후 확인사항

### 1. 배포 상태 확인
- Render 대시보드 → **Logs** 탭에서 배포 로그 확인
- **Events** 탭에서 배포 이벤트 확인

### 2. API 엔드포인트 확인
배포 완료 후 Render가 제공하는 URL로 접속:
- 예: `https://calendar-backend.onrender.com`

### 3. API 테스트
```bash
# Health check (서버가 응답하는지 확인)
curl https://your-backend.onrender.com/api/teams

# 또는 브라우저에서
https://your-backend.onrender.com/api/teams
```

### 4. 데이터베이스 연결 확인
- Logs에서 Prisma 연결 메시지 확인
- 에러가 없으면 정상 연결

---

## 🔄 재배포

### 자동 재배포 (GitHub 연동 시)
- GitHub에 푸시하면 자동으로 재배포됩니다

### 수동 재배포
- Render 대시보드 → **Manual Deploy** → **Deploy latest commit**

---

## 🆘 문제 해결

### 빌드 실패
1. **Logs** 탭에서 에러 확인
2. 일반적인 원인:
   - 환경 변수 누락
   - Prisma 클라이언트 생성 실패
   - 의존성 설치 실패

### 데이터베이스 연결 실패
1. `DATABASE_URL` 환경 변수 확인
2. Supabase 연결 문자열 형식 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인

### CORS 오류
1. `CORS_ORIGIN` 환경 변수 확인
2. 프론트엔드 URL과 정확히 일치하는지 확인
3. 백엔드 코드의 CORS 설정 확인

### Prisma 마이그레이션 실패
1. Shell에서 수동 실행:
   ```bash
   npx prisma migrate deploy
   ```
2. 또는 Build Command에 포함:
   ```bash
   npm install && npm run prisma:generate && npx prisma migrate deploy
   ```

---

## 💡 Render 무료 티어 제한사항

- **15분 비활성 후 슬리프 모드**: 첫 요청 시 약 30초 지연
- **월 750시간 무료**: 충분한 사용량
- **자동 재배포**: GitHub 연동 시

---

## 📚 참고 자료

- [Render 공식 문서](https://render.com/docs)
- [Node.js 배포 가이드](https://render.com/docs/deploy-node-express)


