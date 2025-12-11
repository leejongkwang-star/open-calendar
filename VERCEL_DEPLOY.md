# Vercel 프론트엔드 배포 가이드

## 📋 배포 구성
- **프론트엔드**: Vercel (이 문서)
- **백엔드**: Render ([`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md) 참고)

## ✅ 준비 완료
- ✅ Vercel CLI 설치 완료
- ✅ `vercel.json` 설정 파일 생성 완료
- ✅ 프론트엔드 빌드 완료

---

## 🚀 배포 방법

### 방법 1: Vercel CLI 사용 (터미널)

```bash
cd frontend
vercel
```

**배포 과정:**
1. Vercel 계정 로그인 (브라우저에서 자동으로 열림)
2. 프로젝트 설정 확인:
   - Set up and deploy? → **Y**
   - Which scope? → 계정 선택
   - Link to existing project? → **N** (새 프로젝트)
   - Project name? → 프로젝트 이름 입력 (또는 Enter로 기본값)
   - Directory? → **./** (현재 디렉토리)
   - Override settings? → **N**
3. 배포 완료 후 URL 제공

**프로덕션 배포:**
```bash
vercel --prod
```

### 방법 2: Vercel 웹 대시보드 사용

1. [Vercel](https://vercel.com) 접속 및 로그인
2. **Add New Project** 클릭
3. **Import Git Repository** 선택 (GitHub/GitLab/Bitbucket)
   - 또는 **Browse** 버튼으로 `frontend` 폴더 선택
4. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (또는 `.`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. **Environment Variables** 섹션에서 환경 변수 추가:
   - `VITE_API_BASE_URL` = 백엔드 API URL
6. **Deploy** 클릭

---

## 🔐 환경 변수 설정

배포 후 또는 배포 전에 환경 변수를 설정해야 합니다.

### Vercel 대시보드에서 설정:
1. 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: 백엔드 API URL (예: `https://your-backend.onrender.com/api`)
   - **Environment**: Production, Preview, Development 모두 선택
4. **Save** 클릭
5. **Redeploy** 클릭 (이미 배포된 경우)

### CLI로 설정:
```bash
vercel env add VITE_API_BASE_URL
# 값 입력: https://your-backend.onrender.com/api
# 환경 선택: Production, Preview, Development
```

---

## 📝 배포 후 확인사항

1. **웹사이트 접속 확인**
   - Vercel이 제공하는 URL로 접속
   - 예: `https://your-project.vercel.app`

2. **환경 변수 확인**
   - 브라우저 개발자 도구 → Console
   - API 연결 확인

3. **기능 테스트**
   - 로그인 화면 표시 확인
   - API 호출 확인 (Network 탭)

---

## 🔄 재배포

코드 변경 후 재배포:
```bash
cd frontend
npm run build
vercel --prod
```

또는 Git 연동 시 자동 배포됩니다.

---

## 🛠️ 문제 해결

### 빌드 실패
- `npm run build` 로컬에서 먼저 테스트
- Vercel 로그 확인 (Deployments → 해당 배포 → Logs)

### 환경 변수 적용 안 됨
- 환경 변수 설정 후 **Redeploy** 필요
- 빌드 시점에 환경 변수가 포함되므로 재빌드 필요

### 라우팅 오류
- `vercel.json`의 `rewrites` 설정 확인
- SPA 라우팅을 위해 모든 경로를 `index.html`로 리다이렉트

---

## 📚 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html#vercel)

