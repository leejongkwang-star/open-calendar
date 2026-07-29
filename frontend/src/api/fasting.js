import api from '../utils/api'

export const fastingAPI = {
  // 진행 중인 단식 세션 조회
  getActive: async () => {
    const response = await api.get('/fasting/active')
    return response.data
  },

  // 단식 시작
  start: async ({ startTime, targetHours, note } = {}) => {
    const response = await api.post('/fasting/start', { startTime, targetHours, note })
    return response.data
  },

  // 단식 종료
  stop: async ({ endTime } = {}) => {
    const response = await api.post('/fasting/stop', { endTime })
    return response.data
  },

  // 내 단식 기록 목록
  getSessions: async (limit = 30, offset = 0) => {
    const response = await api.get('/fasting/sessions', { params: { limit, offset } })
    return response.data
  },

  // 팀/전체 직원의 현재 단식 현황
  getTeamStatus: async () => {
    const response = await api.get('/fasting/team-status')
    return response.data
  },

  // 단식 기록 삭제
  deleteSession: async (id) => {
    const response = await api.delete(`/fasting/sessions/${id}`)
    return response.data
  },
}
