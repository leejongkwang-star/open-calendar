import { useState, useMemo, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/ko'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Plus, Filter } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { eventsAPI } from '../api/events'
import { teamsAPI } from '../api/teams'
import EventModal from '../components/EventModal'
import EventPopup from '../components/EventPopup'
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
  const [showEventPopup, setShowEventPopup] = useState(false)
  const [popupEvent, setPopupEvent] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    members: [],
    eventTypes: ['VACATION', 'MEETING', 'TRAINING', 'BUSINESS_TRIP', 'OTHER'],
  })

  // 필터링된 이벤트
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      if (filters.members.length > 0 && !filters.members.includes(event.userId)) {
        return false
      }
      if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.eventType)) {
        return false
      }
      return true
    })
    
    // 일/주 뷰에서 겹치는 이벤트를 세로로 정렬하기 위해 시간 순서로 정렬
    if (view === 'day' || view === 'week') {
      return filtered.sort((a, b) => {
        const startA = a.start ? new Date(a.start).getTime() : 0
        const startB = b.start ? new Date(b.start).getTime() : 0
        return startA - startB
      })
    }
    
    return filtered
  }, [events, filters, view])

  // 이벤트 클릭 핸들러
  const handleSelectEvent = (event, e) => {
    if (view === 'month') {
      // 월뷰에서는 팝업 표시
      // react-big-calendar는 이벤트 객체만 전달하므로
      // DOM 요소를 직접 찾아서 위치 계산
      let popupX = window.innerWidth / 2 - 160
      let popupY = window.innerHeight / 2 - 100
      
      // 이벤트 요소를 찾아서 위치 계산
      // setTimeout을 사용하여 DOM이 렌더링된 후 찾기
      setTimeout(() => {
        const eventTitle = event.title?.replace(/\s*\([^)]+\)\s*$/, '') || event.title || ''
        const eventElements = document.querySelectorAll('.rbc-event')
        
        eventElements.forEach(el => {
          const elText = el.textContent || ''
          // 이벤트 제목이 포함된 요소 찾기
          if (eventTitle && elText.includes(eventTitle)) {
            const rect = el.getBoundingClientRect()
            popupX = rect.left
            popupY = rect.bottom + 5 // 이벤트 아래 5px
            
            // 화면 경계 체크
            if (popupX + 320 > window.innerWidth) {
              popupX = window.innerWidth - 320 - 10
            }
            if (popupY + 200 > window.innerHeight) {
              popupY = rect.top - 200 - 5 // 이벤트 위로 표시
            }
            if (popupX < 10) popupX = 10
            if (popupY < 10) popupY = 10
            
            setPopupPosition({ x: popupX, y: popupY })
          }
        })
        
        // 요소를 찾지 못한 경우 기본 위치 사용
        if (popupX === window.innerWidth / 2 - 160) {
          setPopupPosition({ x: popupX, y: popupY })
        }
      }, 0)
      
      setPopupEvent(event)
      setShowEventPopup(true)
    } else {
      // 일/주 뷰에서는 기존 모달 표시
      setSelectedEvent(event)
      setShowEventModal(true)
    }
  }

  // 날짜 클릭 핸들러
  const handleSelectSlot = ({ start, end, slots, action }) => {
    if (view === 'month') {
      // 월뷰에서 빈 공간 클릭 시
      // 해당 날짜에 본인의 일정이 있는지 확인
      const clickedDate = new Date(start)
      
      // user가 없으면 본인 일정 확인 불가
      if (!user?.id) {
        // user가 없으면 일정 등록 모달 열기
        setSelectedEvent({ start, end })
        setShowEventModal(true)
        return
      }
      
      const hasMyEventsOnDate = filteredEvents.some(event => {
        if (!event.start) return false
        // 본인의 일정인지 확인 (userId 비교)
        if (event.userId !== user.id) {
          return false
        }
        
        // 다중 날짜 이벤트 처리: 시작일과 종료일 사이에 클릭한 날짜가 있는지 확인
        const eventStart = new Date(event.start)
        const eventEnd = event.end ? new Date(event.end) : eventStart
        
        // 날짜만 비교 (시간 제외)
        const clickedDateOnly = new Date(clickedDate.getFullYear(), clickedDate.getMonth(), clickedDate.getDate())
        const eventStartOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
        const eventEndOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
        
        // 클릭한 날짜가 이벤트 기간 내에 있는지 확인
        return clickedDateOnly >= eventStartOnly && clickedDateOnly <= eventEndOnly
      })

      if (hasMyEventsOnDate) {
        // 본인의 일정이 있으면 일뷰로 이동
        setSelectedDate(start)
        setView('day')
      } else {
        // 본인의 일정이 없으면 일정 등록 모달 열기
        setSelectedEvent({ start, end })
        setShowEventModal(true)
      }
    } else {
      // 일/주 뷰에서는 기존 동작 (일정 등록 모달)
      setSelectedEvent({ start, end })
      setShowEventModal(true)
    }
  }

  // 팝업에서 편집 클릭
  const handlePopupEdit = () => {
    setSelectedEvent(popupEvent)
    setShowEventPopup(false)
    setShowEventModal(true)
  }

  // 팝업에서 삭제 클릭
  const handlePopupDelete = () => {
    if (popupEvent?.id) {
      // handleDeleteEvent 내부에서 확인 다이얼로그를 표시하므로 여기서는 확인 제거
      handleDeleteEvent(popupEvent.id)
      setShowEventPopup(false)
    }
  }

  // 팝업에서 메시지 클릭 (SMS 링크)
  const handlePopupMessage = () => {
    if (!popupEvent || !user) return
    
    // 자신에게 메시지를 보낼 수 없도록 체크
    if (popupEvent.userId === user.id) {
      alert('자신에게는 메시지를 보낼 수 없습니다.')
      return
    }
    
    // 일정 등록자의 전화번호 가져오기
    // resource 객체에서 phone 정보 가져오기
    let phoneNumber = popupEvent.resource?.phone || popupEvent.phone || popupEvent.userPhone
    
    if (!phoneNumber) {
      alert('일정 등록자의 연락처 정보가 없습니다.')
      return
    }
    
    // 전화번호에서 숫자만 추출
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    
    if (cleanPhone.length < 10) {
      alert('유효한 전화번호가 아닙니다.')
      return
    }
    
    // 일정 정보로 기본 메시지 템플릿 생성
    const eventTitle = popupEvent.title || '일정'
    const eventDate = popupEvent.startDate 
      ? new Date(popupEvent.startDate).toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : ''
    const defaultMessage = `"${eventTitle}" 일정에 대해 문의드립니다.${eventDate ? ` (${eventDate})` : ''}`
    
    // SMS 링크 생성 (메시지 본문 포함)
    const smsLink = `sms:${cleanPhone}?body=${encodeURIComponent(defaultMessage)}`
    
    // SMS 링크 열기
    window.location.href = smsLink
  }

  // 이벤트 로드 (먼저 정의하여 다른 함수들이 참조할 수 있도록)
  const loadEvents = useCallback(async () => {
    try {
      // 현재 뷰와 선택된 날짜를 기반으로 조회할 날짜 범위 계산
      let startDate = null
      let endDate = null
      
      if (view === 'month') {
        // 월 뷰: 해당 월의 첫날 ~ 마지막날
        const monthStart = moment(selectedDate).startOf('month').toDate()
        const monthEnd = moment(selectedDate).endOf('month').toDate()
        startDate = monthStart
        endDate = monthEnd
      } else if (view === 'week') {
        // 주 뷰: 해당 주의 첫날(일요일) ~ 마지막날(토요일)
        const weekStart = moment(selectedDate).startOf('week').toDate()
        const weekEnd = moment(selectedDate).endOf('week').toDate()
        startDate = weekStart
        endDate = weekEnd
      } else if (view === 'day') {
        // 일 뷰: 해당 날짜
        const dayStart = moment(selectedDate).startOf('day').toDate()
        const dayEnd = moment(selectedDate).endOf('day').toDate()
        startDate = dayStart
        endDate = dayEnd
      } else {
        // agenda 뷰 등: 현재 월 기준으로 조회 (넓은 범위)
        const monthStart = moment(selectedDate).startOf('month').toDate()
        const monthEnd = moment(selectedDate).endOf('month').toDate()
        startDate = monthStart
        endDate = monthEnd
      }
      
      // 모든 팀의 일정을 공유하여 표시하므로 teamId를 항상 null로 전송
      // (특정 팀을 선택한 경우에도 모든 팀의 일정을 보여줌)
      // 날짜 범위를 ISO 문자열로 변환하여 전송
      const startDateStr = startDate ? moment(startDate).toISOString() : null
      const endDateStr = endDate ? moment(endDate).toISOString() : null
      const data = await eventsAPI.getEvents(null, startDateStr, endDateStr)
      // 날짜 형식 변환 (백엔드에서 Date 객체로 받음)
      // react-big-calendar는 end 날짜를 exclusive로 처리하므로,
      // 종료일까지 표시하려면 end를 종료일 다음 날 자정으로 설정해야 함
      
      // 성능 최적화: 백엔드에서 이미 변환된 start/end를 사용하되, 필요시에만 추가 변환
      const formattedEvents = (data || [])
        .map((event) => {
          try {
            // 백엔드에서 이미 변환된 start와 end 사용
            const start = event.start ? new Date(event.start) : null
            const end = event.end ? new Date(event.end) : null
            
            // 유효성 검사
            if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
              if (import.meta.env.DEV) {
                console.warn(`[이벤트 ${event.id}] 유효하지 않은 날짜 정보`)
              }
              return null
            }
            
            // 원본 endDate 저장 (수정 모달에서 사용)
            const originalEndDate = event.endDate ? new Date(event.endDate) : new Date(end)
            
            // react-big-calendar는 end를 exclusive로 처리하므로
            // startDate와 endDate가 같은 날이면 (하루짜리 일정) 시작일 다음 날 00:00:00으로 설정
            // 다른 날이면 (여러 날짜 일정) 종료일 다음 날 00:00:00으로 설정
            const startDate = start.getFullYear() * 10000 + (start.getMonth() + 1) * 100 + start.getDate()
            const endDate = end.getFullYear() * 10000 + (end.getMonth() + 1) * 100 + end.getDate()
            const isSameDay = startDate === endDate
            
            let displayEnd
            if (isSameDay) {
              // 하루짜리 일정: 시작일 다음 날 00:00:00으로 설정하여 하루만 표시
              // react-big-calendar는 end를 exclusive로 처리하므로 다음 날 00:00:00이면 해당 날까지만 표시됨
              displayEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1, 0, 0, 0, 0)
            } else {
              // 여러 날짜 일정: 종료일 다음 날 00:00:00으로 설정
              displayEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0, 0)
            }
            
            return {
              ...event,
              startDate: start, // 원본 startDate 저장
              endDate: end, // 원본 endDate 저장
              start: start, // 캘린더 표시용 start
              end: displayEnd, // 캘린더 표시용 end
              originalEndDate: originalEndDate, // 원본 종료일 (수정 모달용)
            }
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error(`[이벤트 ${event?.id}] 날짜 파싱 오류:`, error)
            }
            return null
          }
        })
        .filter(event => event !== null) // null인 이벤트 제거
        
      setEvents(formattedEvents)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('이벤트 로드 실패:', error)
        console.error('에러 상세:', error.response?.data || error.message)
      }
      setEvents([])
      // 인증 오류(401)만 로그인 페이지로 리다이렉트
      // 403(권한 없음)은 권한 부족이지 인증 실패가 아니므로 리다이렉트하지 않음
      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      }
    }
  }, [user, view, selectedDate])

  // 팀 목록 로드
  const loadTeams = useCallback(async () => {
    try {
      const data = await teamsAPI.getTeams()
      setTeams(data)
      // selectedTeamId는 변경하지 않음 (권한 변경 등으로 인한 팀 ID 변경 방지)
      // 모든 팀의 일정을 조회하므로 selectedTeamId가 없어도 문제없음
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('팀 로드 실패:', error)
      }
    }
  }, [])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  useEffect(() => {
    // 팀 목록이 로드되면 이벤트 조회
    // 모든 팀의 일정을 항상 조회하므로 selectedTeamId와 무관하게 로드
    if (teams.length > 0) {
      loadEvents()
    }
  }, [teams, loadEvents]) // loadEvents 의존성 추가

  // 뷰나 날짜가 변경되면 해당 기간의 일정만 다시 조회
  useEffect(() => {
    if (teams.length > 0) {
      loadEvents()
    }
  }, [view, selectedDate, loadEvents, teams])

  // 일/주 뷰에서 겹치는 이벤트를 세로로 재배치
  useEffect(() => {
    if (view !== 'day' && view !== 'week') return

    let animationFrameId = null
    let intervalId = null

    const rearrangeEvents = () => {
      // requestAnimationFrame으로 실행
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      
      animationFrameId = requestAnimationFrame(() => {
        // 모든 날짜 슬롯을 찾아서 각 슬롯의 이벤트를 세로로 재배치
        const daySlots = document.querySelectorAll('.rbc-day-view .rbc-day-slot, .rbc-week-view .rbc-day-slot')
        
        daySlots.forEach((daySlot) => {
          const eventsContainer = daySlot.querySelector('.rbc-events-container')
          if (!eventsContainer) return

          // 실제 이벤트 요소만 찾기 (세그먼트가 아닌 최상위 이벤트)
          const allEventElements = Array.from(eventsContainer.children)
          const events = allEventElements
            .filter(el => el.classList.contains('rbc-event') || el.querySelector('.rbc-event'))
            .map(el => {
              const eventEl = el.classList.contains('rbc-event') ? el : el.querySelector('.rbc-event')
              if (!eventEl) return null
              
              const rect = eventEl.getBoundingClientRect()
              const containerRect = eventsContainer.getBoundingClientRect()
              const relativeTop = rect.top - containerRect.top
              
              return {
                element: eventEl,
                container: el,
                top: relativeTop,
                height: rect.height || 30,
                originalTop: parseFloat(eventEl.style.top) || relativeTop,
              }
            })
            .filter(Boolean)
            .sort((a, b) => a.originalTop - b.originalTop)

          if (events.length <= 1) return

          // 각 이벤트를 전체 너비로 설정하고 세로로 배치
          events.forEach((eventData, index) => {
            const event = eventData.element
            const container = eventData.container
            
            // 컨테이너와 이벤트 모두 전체 너비로 설정
            container.style.width = 'calc(100% - 8px)'
            container.style.left = '4px'
            container.style.right = '4px'
            container.style.maxWidth = 'calc(100% - 8px)'
            container.style.marginLeft = '0'
            container.style.marginRight = '0'
            container.style.position = 'absolute'
            
            event.style.width = 'calc(100% - 8px)'
            event.style.left = '4px'
            event.style.right = '4px'
            event.style.maxWidth = 'calc(100% - 8px)'
            event.style.marginLeft = '0'
            event.style.marginRight = '0'
            event.style.position = 'absolute'
            
            // 모든 세그먼트와 래퍼도 처리
            const segments = container.querySelectorAll('.rbc-event-segment, .rbc-event-content-wrapper')
            segments.forEach(segment => {
              segment.style.width = 'calc(100% - 8px)'
              segment.style.left = '4px'
              segment.style.right = '4px'
              segment.style.position = 'absolute'
            })
            
            // 이전 이벤트와 겹치는지 확인하여 위치 조정
            let newTop = eventData.originalTop
            if (index > 0) {
              const prevEvent = events[index - 1]
              const prevTop = parseFloat(prevEvent.element.style.top) || prevEvent.originalTop
              const prevHeight = prevEvent.element.offsetHeight || prevEvent.height
              const prevBottom = prevTop + prevHeight
              
              // 이전 이벤트와 겹치면 아래로 배치
              if (newTop < prevBottom) {
                newTop = prevBottom + 2 // 2px 간격
              }
            }
            
            // top 위치 설정
            container.style.top = `${newTop}px`
            event.style.top = `${newTop}px`
            
            // 세그먼트도 같은 위치로
            segments.forEach(segment => {
              segment.style.top = `${newTop}px`
            })
          })
        })
      })
    }

    // 초기 실행
    const initialTimeout = setTimeout(() => {
      rearrangeEvents()
    }, 100)

    // 주기적으로 재배치 (react-big-calendar가 계속 위치를 변경할 수 있음)
    intervalId = setInterval(() => {
      rearrangeEvents()
    }, 200)

    // 이벤트나 뷰가 변경될 때마다 재배치
    const observer = new MutationObserver(() => {
      rearrangeEvents()
    })
    
    const calendarElement = document.querySelector('.rbc-calendar')
    if (calendarElement) {
      observer.observe(calendarElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
      })
    }

    // 스크롤 시에도 재배치
    const scrollHandler = () => {
      rearrangeEvents()
    }
    const timeContent = document.querySelector('.rbc-time-content')
    if (timeContent) {
      timeContent.addEventListener('scroll', scrollHandler, { passive: true })
    }

    return () => {
      clearTimeout(initialTimeout)
      if (intervalId) {
        clearInterval(intervalId)
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      observer.disconnect()
      if (timeContent) {
        timeContent.removeEventListener('scroll', scrollHandler)
      }
    }
  }, [view, filteredEvents])

  // 이벤트 저장 핸들러
  const handleSaveEvent = useCallback(async (eventData) => {
    try {
      // teamId 설정 (이벤트 데이터에서 teamId 우선 사용, 없으면 현재 선택된 팀 사용)
      const teamId = eventData.teamId || selectedEvent?.teamId || selectedTeamId
      
      if (!teamId) {
        alert('팀을 선택해주세요.')
        return
      }
      
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
      
      // 이벤트 목록 새로고침
      loadEvents()
      setShowEventModal(false)
      setSelectedEvent(null)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('이벤트 저장 실패:', error)
      }
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
  }, [selectedEvent, selectedTeamId, user, loadEvents])

  // 이벤트 삭제 핸들러
  const handleDeleteEvent = useCallback(async (eventId) => {
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return

    try {
      await eventsAPI.deleteEvent(eventId)
      
      loadEvents()
      setShowEventModal(false)
      setSelectedEvent(null)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('이벤트 삭제 실패:', error)
      }
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
  }, [loadEvents])

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
    
    // 일/주 뷰에서 겹치는 이벤트를 세로로 배치하기 위해 전체 너비로 설정
    const isDayOrWeekView = view === 'day' || view === 'week'
    
    return {
      style: {
        ...style,
        borderRadius: '6px',
        border: `2px solid ${style.borderColor}`,
        borderLeftWidth: '5px',
        padding: '6px 10px',
        fontSize: '13px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
        minHeight: '24px',
        display: 'flex',
        alignItems: 'center',
        // 일/주 뷰에서 전체 너비로 설정하여 세로 정렬 강제
        ...(isDayOrWeekView && {
          width: 'calc(100% - 8px) !important',
          left: '4px !important',
          right: '4px !important',
          maxWidth: 'calc(100% - 8px) !important',
        }),
      },
    }
  }

  // 커스텀 이벤트 컴포넌트 (세로 정렬을 위해)
  const CustomEventComponent = ({ event, title, ...props }) => {
    const colors = {
      VACATION: {
        backgroundColor: '#2563eb',
        borderColor: '#1e40af',
        color: '#ffffff',
      },
      MEETING: {
        backgroundColor: '#059669',
        borderColor: '#047857',
        color: '#ffffff',
      },
      TRAINING: {
        backgroundColor: '#ea580c',
        borderColor: '#c2410c',
        color: '#ffffff',
      },
      BUSINESS_TRIP: {
        backgroundColor: '#0891b2',
        borderColor: '#0e7490',
        color: '#ffffff',
      },
      OTHER: {
        backgroundColor: '#7c3aed',
        borderColor: '#6d28d9',
        color: '#ffffff',
      },
    }
    
    const style = colors[event?.eventType] || {
      backgroundColor: '#4b5563',
      borderColor: '#374151',
      color: '#ffffff',
    }
    
    // 일/주 뷰에서만 세로 정렬 적용
    const isDayOrWeekView = view === 'day' || view === 'week'
    
    return (
      <div
        style={{
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          color: style.color,
          border: `2px solid ${style.borderColor}`,
          borderLeftWidth: '5px',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
          minHeight: '24px',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          overflow: 'visible',
          // 일/주 뷰에서 전체 너비로 설정하여 세로 정렬 강제
          ...(isDayOrWeekView && {
            width: 'calc(100% - 8px)',
            left: '4px',
            right: '4px',
            maxWidth: 'calc(100% - 8px)',
            position: 'absolute',
          }),
        }}
        onClick={(e) => {
          e.stopPropagation()
          handleSelectEvent(event)
        }}
      >
        {title || event?.title}
      </div>
    )
  }

  // 커스텀 컴포넌트 설정
  const calendarComponents = useMemo(() => {
    // 일/주 뷰에서만 커스텀 이벤트 컴포넌트 사용
    if (view === 'day' || view === 'week') {
      return {
        event: CustomEventComponent,
      }
    }
    return {}
  }, [view])

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

      {/* 이벤트 팝업 (월뷰용) */}
      {showEventPopup && (
        <EventPopup
          event={popupEvent}
          position={popupPosition}
          onClose={() => setShowEventPopup(false)}
          onEdit={handlePopupEdit}
          onDelete={handlePopupDelete}
          onMessage={handlePopupMessage}
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
          components={calendarComponents}
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
