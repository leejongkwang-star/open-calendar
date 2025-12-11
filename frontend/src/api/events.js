import api from '../utils/api'

export const eventsAPI = {
  getEvents: async (teamId, startDate, endDate) => {
    const response = await api.get('/events', {
      params: { teamId, startDate, endDate },
    })
    return response.data
  },
  
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData)
    return response.data
  },
  
  updateEvent: async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData)
    return response.data
  },
  
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`)
    return response.data
  },
  
  getEvent: async (eventId) => {
    const response = await api.get(`/events/${eventId}`)
    return response.data
  },
}

