import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃 추가
})

// 요청 인터셉터: 토큰 추가
api.interceptors.request.use(
  (config) => {
    try {
      // Zustand persist 스토리지에서 토큰 가져오기
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const authData = JSON.parse(authStorage)
        // Zustand persist 형식: { state: { token, user, ... }, version: ... }
        if (authData?.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
        }
      }
    } catch (e) {
      console.error('토큰 파싱 오류:', e)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 로그인 API(/auth/login)의 401 응답은 인터셉터에서 처리하지 않음
      // 로그인 페이지에서 직접 에러 메시지를 표시해야 함
      const isLoginEndpoint = error.config?.url?.includes('/auth/login')
      const isLoginPage = window.location.pathname === '/login'
      
      // 로그인 API가 아니고, 이미 로그인 페이지가 아닐 때만 리다이렉트
      if (!isLoginEndpoint && !isLoginPage) {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

