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

  // 반복 일정 일괄 생성 (사전 생성 방식)
  createEventsBulk: async (events, recurrenceGroupId = null) => {
    const response = await api.post('/events/bulk', { events, recurrenceGroupId })
    return response.data
  },

  updateEvent: async (eventId, eventData, scope = null) => {
    const response = await api.put(`/events/${eventId}`, eventData, {
      params: scope ? { scope } : {},
    })
    return response.data
  },

  deleteEvent: async (eventId, scope = null) => {
    const response = await api.delete(`/events/${eventId}`, {
      params: scope ? { scope } : {},
    })
    return response.data
  },
  
  getEvent: async (eventId) => {
    const response = await api.get(`/events/${eventId}`)
    return response.data
  },
}

