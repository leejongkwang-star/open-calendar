import { useState, useMemo, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/ko'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Filter } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { eventsAPI } from '../api/events'
import { teamsAPI } from '../api/teams'
import { getMockEvents, saveMockEvent, deleteMockEvent, loadMockData } from '../utils/mockData'
import EventModal from '../components/EventModal'
import FilterPanel from '../components/FilterPanel'
import { toKoreanEventType } from '../utils/eventTypeMapping'

// moment를 사용한 로컬라이저
moment.locale('ko')
const localizer = momentLocalizer(moment)

function CalendarPage() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState('month')
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    members: [],
    eventTypes: ['VACATION', 'MEETING', 'TRAINING', 'BUSINESS_TRIP', 'OTHER'],
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
    loadTeams()
  }, [])

  useEffect(() => {
    // 팀 목록이 로드되면 이벤트 조회
    // 모든 팀의 일정을 항상 조회하므로 selectedTeamId와 무관하게 로드
    if (teams.length > 0 || !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true') {
      loadEvents()
    }
  }, [teams]) // selectedTeamId 의존성 제거 (모든 팀의 일정을 항상 조회하므로)

  // 팀 목록 로드
  const loadTeams = async () => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        // 모크 모드: 로컬 스토리지 사용
        const mockTeams = JSON.parse(localStorage.getItem('mockTeams') || '[]')
        setTeams(mockTeams)
        // selectedTeamId는 변경하지 않음 (권한 변경 등으로 인한 팀 ID 변경 방지)
        // 모든 팀의 일정을 조회하므로 selectedTeamId가 없어도 문제없음
      } else {
        // 실제 API 호출
        const data = await teamsAPI.getTeams()
        setTeams(data)
        // selectedTeamId는 변경하지 않음 (권한 변경 등으로 인한 팀 ID 변경 방지)
        // 모든 팀의 일정을 조회하므로 selectedTeamId가 없어도 문제없음
      }
    } catch (error) {
      console.error('팀 로드 실패:', error)
    }
  }

  // 이벤트 저장 핸들러
  const handleSaveEvent = async (eventData) => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      // teamId 설정 (이벤트 데이터에서 teamId 우선 사용, 없으면 현재 선택된 팀 사용)
      const teamId = eventData.teamId || selectedEvent?.teamId || selectedTeamId
      
      if (!teamId && !USE_MOCK) {
        alert('팀을 선택해주세요.')
        return
      }
      
      if (USE_MOCK) {
        // 모크 모드: 로컬 스토리지 사용
        let finalTitle = eventData.title
        if (!selectedEvent?.id && user?.name) {
          // 신규 등록 시: 제목에 사용자 이름 추가 (처음만)
          finalTitle = `${eventData.title} (${user.name})`
        } else if (selectedEvent?.id) {
          // 수정 시: 제목에서 사용자 이름 부분 제거
          finalTitle = eventData.title.replace(/\s*\([^)]+\)\s*$/, '').trim()
        }
        
        const event = {
          ...eventData,
          title: finalTitle,
          teamId: teamId || 1,
          start: new Date(eventData.startDate + (eventData.startTime ? 'T' + eventData.startTime : '')),
          end: new Date(eventData.endDate + (eventData.endTime ? 'T' + eventData.endTime : '')),
        }
        saveMockEvent(event)
      } else {
        // 실제 API 호출
        // 날짜와 시간 처리 로직
        const startDate = eventData.startDate
        const endDate = eventData.endDate
        let startTime = eventData.startTime
        let endTime = eventData.endTime
        
        // 시작일과 종료일이 다른 경우 (여러 날짜 일정)
        if (startDate !== endDate) {
          // 여러 날짜 일정: 시작일 09시, 종료일 18시
          startTime = '09:00'
          endTime = '18:00'
        }
        // 시작일과 종료일이 같은 경우 (하루 일정)
        // 이미 설정된 시간을 그대로 사용 (종일 버튼 클릭 시 09:00-18:00, 그 외에는 등록 시간 +1시간)
        
        // startDate와 endDate에 시간을 포함하여 전송
        // 형식: "YYYY-MM-DDTHH:mm" 또는 "YYYY-MM-DD HH:mm"
        const startDateTime = `${startDate}T${startTime || '00:00'}`
        const endDateTime = `${endDate}T${endTime || '00:00'}`
        
        const finalEventData = {
          ...eventData,
          startDate: startDateTime,
          endDate: endDateTime,
          startTime: null, // startTime은 null로 전송 (startDate에 시간 포함)
          endTime: null, // endTime은 null로 전송 (endDate에 시간 포함)
        }
        
        if (selectedEvent?.id) {
          // 수정 시: 제목에서 사용자 이름 부분 제거
          const cleanTitle = eventData.title.replace(/\s*\([^)]+\)\s*$/, '').trim()
          await eventsAPI.updateEvent(selectedEvent.id, { ...finalEventData, title: cleanTitle })
        } else {
          // 신규 등록 시: 제목에 사용자 이름 추가 (처음만)
          const titleWithName = user?.name 
            ? `${eventData.title} (${user.name})` 
            : eventData.title
          await eventsAPI.createEvent({ ...finalEventData, title: titleWithName, teamId })
        }
      }
      
      // 이벤트 목록 새로고침
      loadEvents()
      setShowEventModal(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error('이벤트 저장 실패:', error)
      const errorMessage = error.response?.data?.message || error.message || '이벤트 저장에 실패했습니다.'
      alert(errorMessage)
      // 인증 오류(401)만 로그인 페이지로 리다이렉트
      // 403(권한 없음)은 권한 부족이지 인증 실패가 아니므로 리다이렉트하지 않음
      if (error.response?.status === 401) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
      // 403 오류는 권한 부족이므로 에러 메시지만 표시하고 모달은 유지
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
      const errorMessage = error.response?.data?.message || error.message || '이벤트 삭제에 실패했습니다.'
      alert(errorMessage)
      // 인증 오류(401)만 로그인 페이지로 리다이렉트
      // 403(권한 없음)은 권한 부족이지 인증 실패가 아니므로 리다이렉트하지 않음
      if (error.response?.status === 401) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
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
        // 실제 API 호출
        // 모든 팀의 일정을 공유하여 표시하므로 teamId를 항상 null로 전송
        // (특정 팀을 선택한 경우에도 모든 팀의 일정을 보여줌)
        const data = await eventsAPI.getEvents(null, null, null)
        // 날짜 형식 변환 (백엔드에서 Date 객체로 받음)
        // react-big-calendar는 end 날짜를 exclusive로 처리하므로,
        // 종료일까지 표시하려면 end를 종료일 다음 날 자정으로 설정해야 함
        console.log('[프론트엔드] 백엔드에서 받은 원본 데이터:', data)
        console.log('[프론트엔드] 받은 이벤트 개수:', data?.length || 0)
        
        const formattedEvents = (data || [])
          .map((event, index) => {
            // 백엔드에서 받은 원본 startDate, endDate 사용 (ISO 문자열로 받음)
            let start = null
            let end = null
            
            try {
              // ISO 문자열을 Date 객체로 변환
              start = event.start ? new Date(event.start) : null
              end = event.end ? new Date(event.end) : null
              
              // 유효한 날짜인지 확인
              if (start && isNaN(start.getTime())) {
                console.warn(`[이벤트 ${event.id}] 유효하지 않은 start 날짜:`, event.start, event)
                return null
              }
              if (end && isNaN(end.getTime())) {
                console.warn(`[이벤트 ${event.id}] 유효하지 않은 end 날짜:`, event.end, event)
                return null
              }
              
              // start나 end가 없으면 제외
              if (!start || !end) {
                console.warn(`[이벤트 ${event.id}] 날짜 정보가 없음:`, { start, end, event })
                return null
              }
              
              // 원본 endDate 저장 (수정 모달에서 사용하기 위해)
              const originalEndDate = new Date(end)
              
              // DB에서 받은 원본 endDate 사용 (백엔드에서 DB 원본 값 전송)
              // endDate는 ISO 문자열로 오므로 UTC 기준으로 날짜 추출 (타임존 문제 방지)
              const dbEndDate = event.endDate ? new Date(event.endDate) : end
              
              // UTC 기준으로 날짜 추출 (타임존 변환 없이)
              // 예: "2025-12-31T18:00:00.000Z" → 12월 31일
              // getUTCFullYear(), getUTCMonth(), getUTCDate() 사용
              const endYear = dbEndDate.getUTCFullYear()
              const endMonth = dbEndDate.getUTCMonth()
              const endDay = dbEndDate.getUTCDate()
              
              // 종료일 다음 날 00:00:00으로 설정 (종료일까지만 표시)
              // react-big-calendar는 end를 exclusive로 처리하므로
              // end가 종료일 다음 날이면 종료일까지만 표시됨
              // 로컬 시간대로 생성 (캘린더 표시용)
              // 예: 종료일 12월 31일 → end = 1월 1일 00:00:00 → 12월 31일까지만 표시
              const displayEnd = new Date(endYear, endMonth, endDay + 1, 0, 0, 0, 0)
              
              return {
                ...event,
                startDate: start, // 원본 startDate 저장
                endDate: end, // 원본 endDate 저장
                start: start, // 캘린더 표시용 start
                end: displayEnd, // 캘린더 표시용 end (하루 일정은 당일 23:59:59, 여러 날은 다음 날 00:00:00)
                originalEndDate: originalEndDate, // 원본 종료일 (수정 모달용)
              }
            } catch (error) {
              console.error(`[이벤트 ${event?.id || index}] 날짜 파싱 오류:`, error, event)
              return null
            }
          })
          .filter(event => event !== null) // null인 이벤트 제거
          
        console.log('[프론트엔드] 이벤트 로드 성공:', formattedEvents.length, '개')
        if (formattedEvents.length > 0) {
          console.log('[프론트엔드] 모든 이벤트 목록:')
          formattedEvents.forEach((event, index) => {
            console.log(`  [${index + 1}] ID: ${event.id}, 제목: ${event.title}, 시작: ${event.start}, 종료: ${event.end}`)
          })
        } else {
          console.warn('[프론트엔드] 유효한 이벤트가 없습니다.')
        }
        setEvents(formattedEvents)
      }
    } catch (error) {
      console.error('이벤트 로드 실패:', error)
      console.error('에러 상세:', error.response?.data || error.message)
      setEvents([])
      // 인증 오류(401)만 로그인 페이지로 리다이렉트
      // 403(권한 없음)은 권한 부족이지 인증 실패가 아니므로 리다이렉트하지 않음
      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        const errorMessage = error.response?.data?.message || error.message || '일정을 불러오는데 실패했습니다.'
        console.error('일정 로드 오류:', errorMessage)
      }
    }
  }

  // 이벤트 스타일 - 가시성 개선
  const eventStyleGetter = (event) => {
    const colors = {
      VACATION: {
        backgroundColor: '#2563eb',
        borderColor: '#1e40af',
        color: '#ffffff',
        fontWeight: '600',
      },
      MEETING: {
        backgroundColor: '#059669',
        borderColor: '#047857',
        color: '#ffffff',
        fontWeight: '600',
      },
      TRAINING: {
        backgroundColor: '#ea580c',
        borderColor: '#c2410c',
        color: '#ffffff',
        fontWeight: '600',
      },
      BUSINESS_TRIP: {
        backgroundColor: '#0891b2',
        borderColor: '#0e7490',
        color: '#ffffff',
        fontWeight: '600',
      },
      OTHER: {
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
          events={filteredEvents.map(event => {
            // 제목에 이미 사용자 이름이 포함되어 있는지 확인 (예: "제목 (이름)" 형식)
            const hasUserNameInTitle = event.title && /\([^)]+\)/.test(event.title)
            // 사용자 이름이 있고, 제목에 이미 포함되어 있지 않으면 추가
            const displayTitle = event.userName && !hasUserNameInTitle 
              ? `${event.title} (${event.userName})` 
              : event.title
            
            return {
              ...event,
              title: displayTitle,
            }
          })}
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
          teams={teams}
          selectedTeamId={selectedTeamId}
        />
      )}
    </div>
  )
}

export default CalendarPage

