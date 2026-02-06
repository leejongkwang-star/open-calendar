import api from '../utils/api'

export const gamesAPI = {
  // 점수 저장
  saveScore: async (gameType, score, metadata = null) => {
    const response = await api.post('/games/scores', {
      gameType,
      score,
      metadata,
    })
    return response.data
  },

  // 랭킹 조회
  getRankings: async (gameType, limit = 100, offset = 0) => {
    const response = await api.get(`/games/scores/${gameType}`, {
      params: { limit, offset },
    })
    return response.data
  },

  // 내 최고 기록 조회
  getMyBestScore: async (gameType) => {
    const response = await api.get(`/games/scores/${gameType}/my`)
    return response.data
  },

  // 내 주변 랭킹 조회
  getRankingsAroundMe: async (gameType) => {
    const response = await api.get(`/games/scores/${gameType}/around-me`)
    return response.data
  },
}

