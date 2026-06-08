import api from '../utils/api'

export const lottoAPI = {
  // 역대 당첨번호 통계 조회 (번호 생성에 필요한 모든 정보 포함)
  getStats: async () => {
    const response = await api.get('/lotto/stats', { timeout: 60000 })
    return response.data
  },

  // 최신 회차 정보
  getLatest: async () => {
    const response = await api.get('/lotto/latest', { timeout: 30000 })
    return response.data
  },
}
