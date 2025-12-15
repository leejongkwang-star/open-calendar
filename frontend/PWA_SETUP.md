# PWA 설정 가이드

## 1. 필요한 패키지 설치

```bash
cd frontend
npm install -D vite-plugin-pwa
```

## 2. 아이콘 이미지 준비

`frontend/public` 폴더에 다음 아이콘 파일들을 추가하세요:
- `icon-192x192.png` (192x192 픽셀)
- `icon-512x512.png` (512x512 픽셀)

아이콘은 앱을 나타내는 이미지로, 로고나 캘린더 아이콘을 사용하면 됩니다.

아이콘 생성 방법:
1. 온라인 도구 사용: https://www.pwabuilder.com/imageGenerator
2. 이미지 리사이징 도구 사용 (Canva, Photoshop 등)
3. 간단한 아이콘 생성기: https://realfavicongenerator.net/

## 3. vite.config.js 수정

`vite.config.js` 파일에 PWA 플러그인을 추가하세요:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: '카드운영부 팀캘린더',
        short_name: '팀캘린더',
        description: '팀 일정을 관리하고 공유하는 캘린더 애플리케이션',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(jpg|jpeg|png|gif|svg|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    open: true,
    host: true
  }
})
```

## 4. 빌드 및 테스트

```bash
npm run build
npm run preview
```

## 5. 배포

Vercel에 배포하면 자동으로 HTTPS가 적용되어 PWA가 작동합니다.

## 6. 설치 방법 (사용자)

### 모바일 (Android/iOS):
1. 브라우저에서 사이트 접속
2. 메뉴에서 "홈 화면에 추가" 또는 "앱 설치" 선택
3. 앱이 설치됨

### 데스크톱 (Chrome/Edge):
1. 주소창 오른쪽의 "설치" 아이콘 클릭
2. 또는 메뉴 > "앱 설치" 선택

## 7. 확인 사항

- [ ] HTTPS 사용 중 (Vercel은 자동 지원)
- [ ] manifest.json 생성됨
- [ ] Service Worker 등록됨
- [ ] 아이콘 이미지 준비됨
- [ ] 오프라인에서도 기본 기능 작동

## 참고 사항

- PWA는 HTTPS 환경에서만 작동합니다
- 로컬 개발 시 `npm run dev`로는 Service Worker가 완전히 작동하지 않을 수 있습니다
- `npm run build && npm run preview`로 테스트하세요
- 브라우저 개발자 도구 > Application > Service Workers에서 등록 상태 확인 가능


