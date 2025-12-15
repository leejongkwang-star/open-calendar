# PWA 빠른 시작 가이드

## 완료된 작업 ✅
- ✅ `manifest.json` 생성됨
- ✅ `vite.config.js`에 PWA 플러그인 설정 추가됨

## 해야 할 작업

### 1. 패키지 설치
```bash
cd frontend
npm install -D vite-plugin-pwa
```

### 2. 아이콘 이미지 준비 (필수!)
`frontend/public` 폴더에 다음 파일들을 추가하세요:

- **icon-192x192.png** (192x192 픽셀 PNG 파일)
- **icon-512x512.png** (512x512 픽셀 PNG 파일)

**아이콘 생성 방법:**
1. 온라인 도구 사용:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   
2. 직접 만들기:
   - 로고나 캘린더 아이콘 이미지를 준비
   - 이미지 편집 도구로 192x192, 512x512 크기로 리사이징
   - PNG 형식으로 저장

### 3. 빌드 및 테스트
```bash
cd frontend
npm run build
npm run preview
```

브라우저에서 접속 후:
- 개발자 도구 (F12) > Application > Service Workers 탭에서 등록 확인
- Application > Manifest 탭에서 manifest 정보 확인
- 주소창에 "설치" 아이콘 표시 확인

### 4. Vercel에 배포
```bash
git add .
git commit -m "Add PWA support"
git push
```

Vercel에 자동 배포되면 HTTPS가 적용되어 PWA가 작동합니다.

## 사용자가 앱 설치하는 방법

### 모바일 (Android/iOS)
1. Chrome/Safari 브라우저에서 사이트 접속
2. 메뉴 버튼(⋮) 클릭
3. **"홈 화면에 추가"** 또는 **"앱 설치"** 선택
4. 앱이 홈 화면에 설치됨

### 데스크톱 (Chrome/Edge)
1. 브라우저 주소창 오른쪽의 **"설치"** 아이콘 클릭
2. 또는 메뉴 > **"앱 설치"** 선택
3. 앱이 독립된 창으로 실행됨

## 확인 사항 체크리스트

배포 후 확인:
- [ ] 브라우저 주소창에 "설치" 아이콘 표시됨
- [ ] Service Worker가 등록됨 (개발자 도구 > Application > Service Workers)
- [ ] Manifest 정보가 올바르게 표시됨 (개발자 도구 > Application > Manifest)
- [ ] 앱을 설치할 수 있음
- [ ] 설치 후 독립된 앱 창으로 실행됨
- [ ] 오프라인 모드에서도 기본 화면 표시됨

## 문제 해결

### 아이콘이 표시되지 않는 경우
- `icon-192x192.png`, `icon-512x512.png` 파일이 `frontend/public` 폴더에 있는지 확인
- 파일 크기가 정확한지 확인 (192x192, 512x512)
- PNG 형식인지 확인

### Service Worker가 등록되지 않는 경우
- HTTPS를 사용 중인지 확인 (Vercel은 자동 지원)
- `npm run build` 후 `npm run preview`로 테스트
- 브라우저 캐시 삭제 후 재시도

### 로컬에서 테스트 안 되는 경우
- `npm run dev`가 아닌 `npm run build && npm run preview` 사용
- 또는 로컬 HTTPS 서버 사용 (예: `local-ssl-proxy`)

## 추가 기능 (선택사항)

향후 추가할 수 있는 기능:
- 푸시 알림 (일정 알림 등)
- 오프라인 데이터 동기화
- 백그라운드 동기화


