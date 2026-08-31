import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { DEFAULT_DEPT_NAME, ICON_SETS, resolveIconSet, iconPath } from './src/utils/deptIcons.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const deptName = env.VITE_DEPT_NAME?.trim() || DEFAULT_DEPT_NAME
  const iconSet = resolveIconSet(deptName, env.VITE_ICON_SET)
  // 모든 부서 아이콘이 dist 에 복사되므로, 이 배포가 쓰지 않는 세트는 프리캐시에서 뺀다.
  const unusedIconSets = [...new Set(Object.values(ICON_SETS))].filter((s) => s !== iconSet)

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: `${deptName} 팀캘린더`,
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
              src: iconPath(iconSet, 192),
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: iconPath(iconSet, 512),
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          globIgnores: unusedIconSets.map((s) => `**/icons/${s}/**`),
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 5 * 60 // 5 minutes
                },
                networkTimeoutSeconds: 10
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
  }
})
