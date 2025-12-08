import api from '../utils/api'

export const authAPI = {
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData)
    return response.data
  },
  
  checkEmployeeNumber: async (employeeNumber) => {
    const response = await api.get('/auth/check-employee-number', { params: { employeeNumber } })
    return response.data
  },
  
  login: async (employeeNumber, password) => {
    const response = await api.post('/auth/login', { employeeNumber, password })
    return response.data
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  
  getPendingUsers: async () => {
    const response = await api.get('/auth/pending')
    return response.data
  },
  
  approveUser: async (userId) => {
    const response = await api.post(`/auth/approve/${userId}`)
    return response.data
  },
  
  rejectUser: async (userId, reason) => {
    const response = await api.post(`/auth/reject/${userId}`, { reason })
    return response.data
  },

  // 전체 회원 목록 조회 (관리자)
  getAllUsers: async (params = {}) => {
    const response = await api.get('/auth/users', { params })
    return response.data
  },

  // 회원 정보 수정 (관리자)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/auth/users/${userId}`, userData)
    return response.data
  },

  // 회원 삭제 (관리자)
  deleteUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}`)
    return response.data
  },

  // 직원번호로 사용자 조회 (관리자)
  getUserByEmployeeNumber: async (employeeNumber) => {
    const response = await api.get('/auth/user-by-employee-number', { params: { employeeNumber } })
    return response.data
  },
}

