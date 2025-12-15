# PWA 빌드 오류 해결 가이드

## 문제 원인
1. `public/manifest.json`의 아이콘 경로가 실제 파일명과 다름
2. `public/sw.js`가 `vite-plugin-pwa`와 충돌
3. `vite-plugin-pwa`가 자동으로 manifest를 생성하므로 수동 manifest.json 불필요

## 해결 단계

### 1단계: 충돌하는 파일 제거 또는 이름 변경

`vite-plugin-pwa`가 자동으로 service worker를 생성하므로, 수동으로 만든 파일들을 처리해야 합니다:

**옵션 A (권장): 파일 삭제**
- `frontend/public/sw.js` 파일 삭제
- `frontend/public/manifest.json` 파일 삭제 (vite.config.js에서 자동 생성됨)

**옵션 B: 파일 이름 변경 (백업용)**
- `frontend/public/sw.js` → `frontend/public/sw.js.backup`
- `frontend/public/manifest.json` → `frontend/public/manifest.json.backup`

### 2단계: index.html에서 수동 manifest 링크 제거 (선택사항)

`vite-plugin-pwa`가 자동으로 manifest를 추가하므로, `index.html`의 다음 줄을 제거하거나 주석 처리:

```html
<!-- 이 줄 제거 또는 주석 처리 -->
<link rel="manifest" href="/manifest.json" />
```

### 3단계: 패키지 확인 및 설치

```bash
cd frontend
npm install
```

`vite-plugin-pwa`가 `package.json`에 있는지 확인:
- `devDependencies`에 `"vite-plugin-pwa": "^1.2.0"` 있어야 함

### 4단계: 빌드 실행

```bash
cd frontend
npm run build
```

### 5단계: 빌드 결과 확인

빌드가 성공하면 `frontend/dist` 폴더에 다음 파일들이 생성됩니다:
- `manifest.webmanifest` (자동 생성)
- `sw.js` (Service Worker, 자동 생성)
- `workbox-*.js` (Workbox 라이브러리)

### 6단계: 로컬 테스트

```bash
npm run preview
```

브라우저에서 접속 후:
1. 개발자 도구 (F12) 열기
2. **Application** 탭 > **Service Workers**에서 등록 확인
3. **Application** 탭 > **Manifest**에서 정보 확인
4. 주소창에 "설치" 아이콘 표시 확인

## 일반적인 오류 메시지별 해결법

### 오류: "Cannot find module 'vite-plugin-pwa'"
```bash
cd frontend
npm install -D vite-plugin-pwa
```

### 오류: "Icon file not found"
- `frontend/public/icon-192x192.png` 파일이 있는지 확인
- `frontend/public/icon-512x512.png` 파일이 있는지 확인
- 파일명이 정확한지 확인 (대소문자 구분)

### 오류: "Service Worker registration failed"
- `public/sw.js` 파일이 있으면 삭제
- 브라우저 캐시 삭제 후 재시도
- HTTPS 환경에서 테스트 (로컬은 `npm run preview` 사용)

### 빌드는 성공하지만 PWA가 작동하지 않음
1. `npm run preview`로 테스트 (개발 서버가 아닌 빌드된 버전)
2. 브라우저 개발자 도구 > Application > Service Workers 확인
3. 브라우저 캐시 완전 삭제 (Ctrl+Shift+Delete)

## 최종 확인 체크리스트

빌드 전:
- [ ] `frontend/public/sw.js` 삭제 또는 이름 변경
- [ ] `frontend/public/manifest.json` 삭제 또는 이름 변경 (선택사항)
- [ ] `frontend/public/icon-192x192.png` 존재 확인
- [ ] `frontend/public/icon-512x512.png` 존재 확인
- [ ] `vite-plugin-pwa` 패키지 설치 확인

빌드 후:
- [ ] `npm run build` 성공
- [ ] `frontend/dist` 폴더에 `manifest.webmanifest` 생성됨
- [ ] `frontend/dist` 폴더에 `sw.js` 생성됨
- [ ] `npm run preview`로 테스트 시 Service Worker 등록됨

## 참고사항

- `vite-plugin-pwa`는 빌드 시 자동으로 manifest와 service worker를 생성합니다
- 수동으로 만든 `manifest.json`이나 `sw.js`는 충돌을 일으킬 수 있습니다
- 로컬 개발 시 `npm run dev`는 PWA 기능이 완전히 작동하지 않을 수 있으므로, `npm run build && npm run preview`로 테스트하세요

