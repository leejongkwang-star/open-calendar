import { useState, useMemo, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/ko'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Filter } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { eventsAPI } from '../api/events'
import { getMockEvents, saveMockEvent, deleteMockEvent, loadMockData } from '../utils/mockData'
import EventModal from '../components/EventModal'
import FilterPanel from '../components/FilterPanel'

// moment를 사용한 로컬라이저
moment.locale('ko')
const localizer = momentLocalizer(moment)

function CalendarPage() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState('month')
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    members: [],
    eventTypes: ['휴가', '회의', '기타'],
  })

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filters.members.length > 0 && !filters.members.includes(event.userId)) {
        return false
      }
      if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.eventType)) {
        return false
      }
      return true
    })
  }, [events, filters])

  // 이벤트 클릭 핸들러
  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  // 날짜 클릭 핸들러
  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({ start, end })
    setShowEventModal(true)
  }

  useEffect(() => {
    loadMockData()
    loadEvents()
  }, [])

  // 이벤트 저장 핸들러
  const handleSaveEvent = async (eventData) => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        // 모크 모드: 로컬 스토리지 사용
        const event = {
          ...eventData,
          start: new Date(eventData.startDate + (eventData.startTime ? 'T' + eventData.startTime : '')),
          end: new Date(eventData.endDate + (eventData.endTime ? 'T' + eventData.endTime : '')),
        }
        saveMockEvent(event)
      } else {
        // 실제 API 호출
        if (selectedEvent?.id) {
          await eventsAPI.updateEvent(selectedEvent.id, eventData)
        } else {
          await eventsAPI.createEvent(eventData)
        }
      }
      
      // 이벤트 목록 새로고침
      loadEvents()
      setShowEventModal(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('이벤트 저장 실패:', error)
      alert('이벤트 저장에 실패했습니다.')
    }
  }

  // 이벤트 삭제 핸들러
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        deleteMockEvent(eventId)
      } else {
        await eventsAPI.deleteEvent(eventId)
      }
      
      loadEvents()
      setShowEventModal(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('이벤트 삭제 실패:', error)
      alert('이벤트 삭제에 실패했습니다.')
    }
  }

  // 이벤트 로드
  const loadEvents = async () => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        // 모크 모드: 로컬 스토리지에서 로드
        const mockEvents = getMockEvents()
        setEvents(mockEvents)
      } else {
        // 실제 API 호출 (나중에 팀 선택 및 날짜 범위 추가 필요)
        const data = await eventsAPI.getEvents(null, null, null)
        setEvents(data)
      }
    } catch (error) {
      console.error('이벤트 로드 실패:', error)
      // 에러 발생 시에도 모크 데이터 사용
      const mockEvents = getMockEvents()
      setEvents(mockEvents)
    }
  }

  // 이벤트 스타일 - 가시성 개선
  const eventStyleGetter = (event) => {
    const colors = {
      휴가: {
        backgroundColor: '#2563eb',
        borderColor: '#1e40af',
        color: '#ffffff',
        fontWeight: '600',
      },
      회의: {
        backgroundColor: '#059669',
        borderColor: '#047857',
        color: '#ffffff',
        fontWeight: '600',
      },
      기타: {
        backgroundColor: '#7c3aed',
        borderColor: '#6d28d9',
        color: '#ffffff',
        fontWeight: '600',
      },
    }
    
    const style = colors[event.eventType] || {
      backgroundColor: '#4b5563',
      borderColor: '#374151',
      color: '#ffffff',
      fontWeight: '600',
    }
    
    return {
      style: {
        ...style,
        borderRadius: '6px',
        border: `2px solid ${style.borderColor}`,
        padding: '6px 10px',
        fontSize: '13px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
        minHeight: '24px',
        display: 'flex',
        alignItems: 'center',
      },
    }
  }

  return (
    <div className="h-full">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">캘린더</h1>
          <p className="text-sm text-gray-600 mt-1">팀 일정을 확인하고 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`btn-secondary flex items-center ${showFilter ? 'bg-primary-100' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
          </button>
          <button
            onClick={() => {
              setSelectedEvent(null)
              setShowEventModal(true)
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            일정 추가
          </button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilter && (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* 캘린더 */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6" style={{ minHeight: '700px' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents.map(event => ({
            ...event,
            title: event.userName ? `${event.title} (${event.userName})` : event.title,
          }))}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '650px' }}
          view={view}
          onView={setView}
          date={selectedDate}
          onNavigate={setSelectedDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          popup
          showMultiDayTimes
          step={60}
          timeslots={1}
          messages={{
            next: '다음',
            previous: '이전',
            today: '오늘',
            month: '월',
            week: '주',
            day: '일',
            agenda: '일정',
            date: '날짜',
            time: '시간',
            event: '이벤트',
            noEventsInRange: '이 기간에 일정이 없습니다.',
          }}
          formats={{
            dayFormat: 'D일',
            weekdayFormat: 'ddd',
            monthHeaderFormat: 'YYYY년 M월',
            dayHeaderFormat: 'M월 D일 (ddd)',
            dayRangeHeaderFormat: ({ start, end }) => 
              `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`,
            timeGutterFormat: 'HH:mm',
            eventTimeRangeFormat: ({ start, end }) => 
              `${start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`,
          }}
        />
      </div>

      {/* 이벤트 모달 */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          currentUser={user}
        />
      )}
    </div>
  )
}

export default CalendarPage

