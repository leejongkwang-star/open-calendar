# Vercel 배포 환경에서 직원번호 중복 확인 오류 해결

## 🔴 문제 상황

Vercel에 배포된 프론트엔드(`open-calendar-frontend.vercel.app`)에서 "직원번호 확인 중 오류가 발생했습니다" 오류 발생.

## 🔍 원인

프론트엔드가 백엔드 API에 연결하지 못하고 있습니다.

- `VITE_API_BASE_URL` 환경 변수가 Vercel에 설정되지 않음
- 기본값 `http://localhost:3001/api`를 사용하려고 시도
- 배포 환경에서는 로컬호스트가 작동하지 않음

## ✅ 해결 방법

### 1단계: Render 백엔드 URL 확인

Render에 백엔드가 배포되어 있다면 URL을 확인하세요:
- 예: `https://your-backend-name.onrender.com`
- API 엔드포인트: `https://your-backend-name.onrender.com/api`

### 2단계: Vercel 환경 변수 설정

#### 방법 A: Vercel 웹 대시보드 사용 (권장)

1. **Vercel 대시보드 접속**
   - https://vercel.com 접속
   - 로그인 후 프로젝트 선택 (`open-calendar-frontend`)

2. **환경 변수 설정**
   - 프로젝트 페이지에서 **Settings** 클릭
   - 왼쪽 메뉴에서 **Environment Variables** 클릭

3. **새 환경 변수 추가**
   - **Add New** 버튼 클릭
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: 백엔드 API URL (예: `https://your-backend.onrender.com/api`)
   - **Environment**: 
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - **Add** 클릭

4. **재배포 (중요!)**
   - 환경 변수 변경 후 반드시 재배포 필요
   - **Deployments** 탭으로 이동
   - 최신 배포의 **"⋯"** 메뉴 클릭
   - **Redeploy** 선택
   - 또는 **Settings** → **Environment Variables**에서 **Redeploy** 버튼 클릭

#### 방법 B: Vercel CLI 사용

```bash
# Vercel CLI로 환경 변수 추가
vercel env add VITE_API_BASE_URL

# 프롬프트에 따라:
# Value: https://your-backend.onrender.com/api
# Environment: Production, Preview, Development (모두 선택)
```

재배포:
```bash
vercel --prod
```

## 📝 환경 변수 확인

### 브라우저 콘솔에서 확인

1. 배포된 사이트 접속 (F12 개발자 도구 열기)
2. **Console** 탭에서 확인:
   ```javascript
   // 확인 방법 (Console에서 실행)
   console.log('API URL:', import.meta.env.VITE_API_BASE_URL)
   ```
   
3. **Network** 탭에서 확인:
   - 직원번호 입력 시
   - `/auth/check-employee-number` 요청 확인
   - 요청 URL이 올바른 백엔드 URL인지 확인

## 🔧 백엔드 URL 형식

### Render 백엔드 사용 시
```
https://your-backend-name.onrender.com/api
```

**예시:**
- 백엔드 Render URL: `https://calendar-backend-abc123.onrender.com`
- `VITE_API_BASE_URL`: `https://calendar-backend-abc123.onrender.com/api`

### 로컬 개발 시
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## ✅ 확인 체크리스트

- [ ] Render 백엔드가 정상 실행 중인가?
- [ ] Render 백엔드 URL을 확인했는가?
- [ ] Vercel 환경 변수에 `VITE_API_BASE_URL`이 설정되었는가?
- [ ] 환경 변수 설정 후 **재배포**를 했는가? (중요!)
- [ ] 브라우저 콘솔에서 API URL이 올바른지 확인했는가?
- [ ] Network 탭에서 API 요청이 올바른 URL로 가는지 확인했는가?

## 🚨 추가 문제 해결

### 백엔드가 Render에 배포되지 않은 경우

1. **백엔드를 먼저 Render에 배포**
   - `RENDER_DEPLOY.md` 참고

2. **배포 완료 후 URL 확인**
   - Render 대시보드에서 서비스 URL 확인

3. **Vercel 환경 변수 설정**
   - 위 2단계 참고

### CORS 오류가 발생하는 경우

백엔드 `server.js`에서 CORS 설정 확인:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://open-calendar-frontend.vercel.app',
    'https://your-vercel-domain.vercel.app'
  ],
  credentials: true
}))
```

---

## 💡 빠른 해결 요약

1. **Render 백엔드 URL 확인** (`https://xxx.onrender.com`)
2. **Vercel 대시보드** → **Settings** → **Environment Variables**
3. **`VITE_API_BASE_URL`** 추가: `https://xxx.onrender.com/api`
4. **재배포** (중요!)

재배포 후 오류가 해결됩니다!

