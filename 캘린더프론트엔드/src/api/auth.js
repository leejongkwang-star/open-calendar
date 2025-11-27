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
}

