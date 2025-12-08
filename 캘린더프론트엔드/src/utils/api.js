import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      // 인증 실패 시 로그아웃
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

