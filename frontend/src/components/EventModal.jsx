import { useState, useEffect } from 'react'
import { X, Trash2, Calendar, Clock, FileText, Users } from 'lucide-react'
import { toEnglishEventType, toKoreanEventType, EVENT_TYPE_OPTIONS } from '../utils/eventTypeMapping'

function EventModal({ event, onClose, onSave, onDelete, currentUser, teams, selectedTeamId }) {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    eventType: 'VACATION',
    description: '',
    teamId: null,
  })

  const isEditMode = event?.id

  // 시간에 1시간 더하는 함수
  const addOneHour = (timeStr) => {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return '10:00'
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    date.setHours(date.getHours() + 1)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 사용자가 속한 팀 찾기 (role이 null이 아닌 팀)
  const getUserTeamId = () => {
    // 1. currentUser.teamId 우선 사용
    if (currentUser?.teamId) {
      return currentUser.teamId
    }
    
    // 2. teams 배열에서 사용자가 속한 팀 찾기 (role이 null이 아닌 팀)
    if (teams && teams.length > 0) {
      const userTeam = teams.find(team => team.role !== null && team.role !== undefined)
      if (userTeam) {
        return userTeam.id
      }
    }
    
    // 3. selectedTeamId 사용
    if (selectedTeamId) {
      return selectedTeamId
    }
    
    // 4. 마지막으로 teams[0].id 사용
    if (teams && teams.length > 0) {
      return teams[0].id
    }
    
    return null
  }

  useEffect(() => {
    if (event) {
      // 수정 모드일 때
      if (isEditMode) {
        // 백엔드에서 받은 원본 startDate, endDate 사용 (DB 값과 동일, UTC 형식)
        const dbStartDate = event.startDate ? new Date(event.startDate) : (event.start ? new Date(event.start) : new Date())
        const dbEndDate = event.endDate ? new Date(event.endDate) : (event.end ? new Date(event.end) : new Date())
        
        // originalEndDate가 있으면 사용 (react-big-calendar용 변환 전 원본)
        const end = event.originalEndDate ? new Date(event.originalEndDate) : dbEndDate
        
        // 수정 모드일 때 제목에서 사용자 이름 제거 (예: "제목 (이름)" → "제목")
        let cleanTitle = event.title || ''
        if (cleanTitle) {
          // 제목 끝에 "(이름)" 형식이 있으면 제거
          cleanTitle = cleanTitle.replace(/\s*\([^)]+\)\s*$/, '').trim()
        }
        
        // 시간 포맷팅 (UTC 기준으로 시간 추출 - DB 값 그대로 표시)
        const formatTime = (dateObj) => {
          if (!dateObj) return '09:00'
          const date = new Date(dateObj)
          // UTC 시간 사용 (DB에 저장된 시간 그대로)
          const hours = String(date.getUTCHours()).padStart(2, '0')
          const minutes = String(date.getUTCMinutes()).padStart(2, '0')
          return `${hours}:${minutes}`
        }

        // 날짜 포맷팅 (UTC 기준으로 날짜 추출 - DB 값 그대로 표시)
        const formatDateUTC = (dateObj) => {
          if (!dateObj) return ''
          const date = new Date(dateObj)
          // UTC 기준으로 날짜 추출 (타임존 변환으로 인한 날짜 오류 방지)
          const year = date.getUTCFullYear()
          const month = String(date.getUTCMonth() + 1).padStart(2, '0')
          const day = String(date.getUTCDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        // DB에 저장된 startDate, endDate에서 직접 시간 추출 (UTC 기준)
        // startTime, endTime이 별도로 있으면 사용, 없으면 startDate, endDate에서 추출
        const startTime = event.startTime ? formatTime(event.startTime) : formatTime(dbStartDate)
        const endTime = event.endTime ? formatTime(event.endTime) : formatTime(end)

        setFormData({
          title: cleanTitle,
          startDate: formatDateUTC(dbStartDate), // UTC 기준 날짜
          endDate: formatDateUTC(end), // UTC 기준 날짜 (DB 원본 값)
          startTime: startTime, // UTC 기준 시간 (DB 원본 값)
          endTime: endTime, // UTC 기준 시간 (DB 원본 값)
          eventType: event.eventType || 'VACATION',
          description: event.description || '',
          teamId: event.teamId || getUserTeamId(),
        })
      } else {
        // 신규 등록 시: 시작일을 선택한 날짜로 설정, 종료일도 시작일과 동일
        const selectedDate = event?.start ? new Date(event.start) : new Date()
        const startDateStr = formatDate(selectedDate)
        
        // 신규 등록 시 기본적으로 종일 설정 (09:00-18:00)
        const startTime = '09:00'
        const endTime = '18:00'
        
        setFormData({
          title: '',
          startDate: startDateStr,
          endDate: startDateStr, // 종료일을 시작일과 동일하게 설정 (event.end 무시)
          startTime: startTime,
          endTime: endTime,
          eventType: 'VACATION',
          description: '',
          teamId: getUserTeamId(),
        })
      }
    } else {
      // event가 없는 경우 (직접 모달 열기)
      const today = new Date()
      const startDateStr = formatDate(today)
      const startTime = '09:00'
      const endTime = addOneHour(startTime)
      
      setFormData({
        title: '',
        startDate: startDateStr,
        endDate: startDateStr,
        startTime: startTime,
        endTime: endTime,
        eventType: 'VACATION',
        description: '',
        teamId: getUserTeamId(),
      })
    }
  }, [event, isEditMode, teams, currentUser, selectedTeamId])

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    // 로컬 시간대를 사용하여 날짜 포맷팅 (UTC 변환으로 인한 날짜 오류 방지)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: event?.id,
    })
  }

  const canDelete = isEditMode && (currentUser?.role && currentUser.role.toUpperCase() === 'ADMIN' || event?.userId === currentUser?.id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? '일정 수정' : '새 일정'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="일정 제목을 입력하세요"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                시작일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value
                  // 시작일 변경 시 종료일이 시작일보다 이전이면 종료일도 동일하게 설정
                  const newEndDate = newStartDate < formData.endDate ? newStartDate : formData.endDate
                  
                  // 날짜가 변경되면 시간 재설정
                  let newStartTime = formData.startTime
                  let newEndTime = formData.endTime
                  
                  if (newStartDate !== newEndDate) {
                    // 여러 날짜 일정: 시작일 09시, 종료일 18시
                    newStartTime = '09:00'
                    newEndTime = '18:00'
                  } else {
                    // 하루 일정: 등록 시간을 시작시간으로, +1시간을 종료시간으로
                    const now = new Date()
                    const currentHour = String(now.getHours()).padStart(2, '0')
                    const currentMinute = String(now.getMinutes()).padStart(2, '0')
                    const currentTime = `${currentHour}:${currentMinute}`
                    newStartTime = currentTime
                    newEndTime = addOneHour(currentTime)
                  }
                  
                  setFormData({ 
                    ...formData, 
                    startDate: newStartDate, 
                    endDate: newEndDate,
                    startTime: newStartTime,
                    endTime: newEndTime,
                  })
                }}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  const newEndDate = e.target.value
                  // 종료일 변경 시: 시작일과 다른 날이면 시간 자동 설정 (여러 날짜 일정)
                  let newStartTime = formData.startTime
                  let newEndTime = formData.endTime
                  
                  if (newEndDate !== formData.startDate) {
                    // 여러 날짜 일정: 시작일 09시, 종료일 18시
                    newStartTime = '09:00'
                    newEndTime = '18:00'
                  } else {
                    // 하루 일정으로 변경: 등록 시간을 시작시간으로, +1시간을 종료시간으로
                    const now = new Date()
                    const currentHour = String(now.getHours()).padStart(2, '0')
                    const currentMinute = String(now.getMinutes()).padStart(2, '0')
                    const currentTime = `${currentHour}:${currentMinute}`
                    newStartTime = currentTime
                    newEndTime = addOneHour(currentTime)
                  }
                  
                  setFormData({ 
                    ...formData, 
                    endDate: newEndDate,
                    startTime: newStartTime,
                    endTime: newEndTime,
                  })
                }}
                min={formData.startDate}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 inline mr-1" />
                시간 <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  // 종일 버튼: 하루 일정이면 09:00-18:00, 여러 날 일정이면 시작일 09:00 종료일 18:00
                  // 여러 날 일정은 기본적으로 종일 설정 (시작일 09:00, 종료일 18:00)
                  setFormData({
                    ...formData,
                    startTime: '09:00',
                    endTime: '18:00',
                  })
                }}
                className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                종일
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  시작 시간
                </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value
                      // 시작시간 변경 시: 하루 일정이면 종료시간 +1시간, 여러 날 일정이면 종료시간 18:00 유지
                      let newEndTime = formData.endTime
                      if (formData.startDate === formData.endDate) {
                        // 하루 일정: 종료시간 자동으로 +1시간 설정
                        newEndTime = addOneHour(newStartTime)
                      }
                      // 여러 날 일정: 종료시간은 18:00으로 유지
                      setFormData({ ...formData, startTime: newStartTime, endTime: newEndTime })
                    }}
                    className="input-field"
                    required
                  />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                일정 유형 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="input-field"
                required
              >
                {EVENT_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                팀 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.teamId || ''}
                onChange={(e) => setFormData({ ...formData, teamId: parseInt(e.target.value) })}
                className="input-field"
                required
              >
                {teams && teams.length > 0 ? (
                  teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))
                ) : (
                  <option value="">팀을 선택하세요</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="일정에 대한 설명을 입력하세요"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(event.id)}
                className="btn-secondary flex items-center text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary">
              취소
            </button>
            <button type="submit" className="btn-primary">
              {isEditMode ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventModal

