# Vercel 배포 가이드

## 방법 1: Vercel CLI 사용 (권장)

### 1. Vercel CLI 설치
```powershell
npm install -g vercel
```

### 2. Vercel 로그인
```powershell
vercel login
```
브라우저가 열리면 Vercel 계정으로 로그인하세요.

### 3. 프로젝트 배포
```powershell
cd "$env:USERPROFILE\OneDrive\문서\Cursor\open-calendar-app\frontend"
vercel
```

첫 배포 시 다음 질문들이 나옵니다:
- **Set up and deploy?** → `Y` 입력
- **Which scope?** → 본인의 계정 선택
- **Link to existing project?** → `N` (새 프로젝트)
- **What's your project's name?** → 원하는 프로젝트 이름 입력 (예: `calendar-frontend`)
- **In which directory is your code located?** → `./` (현재 디렉토리)
- **Override settings?** → `N` (기본 설정 사용)

### 4. 프로덕션 배포
```powershell
vercel --prod
```

## 방법 2: Vercel 웹 대시보드 사용

### 1. GitHub에 코드 푸시
프로젝트를 GitHub 저장소에 푸시합니다.

### 2. Vercel 대시보드에서 배포
1. [vercel.com](https://vercel.com)에 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. "Deploy" 클릭

## 환경 변수 설정

백엔드 API URL이 필요한 경우:

1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   - `VITE_API_URL`: 백엔드 API URL (예: `https://your-backend.vercel.app`)

## 배포 확인

배포가 완료되면:
- Vercel이 자동으로 URL을 제공합니다 (예: `https://your-project.vercel.app`)
- 각 배포마다 고유한 URL이 생성됩니다
- 프로덕션 배포는 커스텀 도메인 또는 기본 `.vercel.app` 도메인을 사용합니다

## 문제 해결

### 빌드 실패 시
- Vercel 대시보드의 "Deployments" 탭에서 로그 확인
- 로컬에서 `npm run build`가 성공하는지 확인

### 환경 변수 문제
- 환경 변수가 올바르게 설정되었는지 확인
- `VITE_` 접두사가 있는 변수만 프론트엔드에서 접근 가능

### PWA 관련 문제
- HTTPS가 활성화되어 있는지 확인 (Vercel은 기본적으로 HTTPS 제공)
- Service Worker가 정상 작동하는지 확인

