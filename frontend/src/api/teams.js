import api from '../utils/api'

export const teamsAPI = {
  // 공개 팀 목록 조회 (회원가입용, 인증 불필요)
  getPublicTeams: async () => {
    const response = await api.get('/teams/public')
    return response.data
  },
  
  getTeams: async () => {
    const response = await api.get('/teams')
    return response.data
  },
  
  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData)
    return response.data
  },
  
  updateTeam: async (teamId, teamData) => {
    const response = await api.put(`/teams/${teamId}`, teamData)
    return response.data
  },
  
  deleteTeam: async (teamId) => {
    const response = await api.delete(`/teams/${teamId}`)
    return response.data
  },
  
  getTeamMembers: async (teamId) => {
    const response = await api.get(`/teams/${teamId}/members`)
    return response.data
  },
  
  addTeamMember: async (teamId, memberData) => {
    const response = await api.post(`/teams/${teamId}/members`, memberData)
    return response.data
  },
  
  updateTeamMember: async (teamId, memberId, memberData) => {
    const response = await api.put(`/teams/${teamId}/members/${memberId}`, memberData)
    return response.data
  },
  
  deleteTeamMember: async (teamId, memberId) => {
    const response = await api.delete(`/teams/${teamId}/members/${memberId}`)
    return response.data
  },
  
  updateMemberRole: async (teamId, memberId, role) => {
    const response = await api.patch(`/teams/${teamId}/members/${memberId}/role`, { role })
    return response.data
  },
}

