import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { APP_TITLE, FAVICON_URL } from './utils/branding'
import './styles/index.css'

document.title = APP_TITLE

// 아이콘도 부서별로 달라지므로 index.html 이 아니라 여기서 주입한다.
// apple-touch-icon 은 iOS 홈화면 추가 시 manifest 보다 우선 적용된다.
for (const rel of ['icon', 'apple-touch-icon']) {
  const link = document.createElement('link')
  link.rel = rel
  link.type = 'image/png'
  link.href = FAVICON_URL
  document.head.appendChild(link)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

