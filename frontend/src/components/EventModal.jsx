import { useState, useEffect } from 'react'
import { X, Trash2, Calendar, Clock, FileText, Users, Repeat } from 'lucide-react'
import { toEnglishEventType, toKoreanEventType, EVENT_TYPE_OPTIONS } from '../utils/eventTypeMapping'
import { parseEventTitle, buildEventTitle } from '../utils/titleUtils'

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
    recurrenceType: 'NONE',
    recurrenceEndMode: 'count',
    recurrenceCount: 10,
    recurrenceUntil: '',
  })

  // 제목 앞에 표시되는 작성자 이름 (수정 불가, 저장 시 "(이름) 내용" 형태로 결합)
  const [ownerName, setOwnerName] = useState('')

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
        
        // 수정 모드: 제목에서 작성자 이름과 내용 분리 (앞/뒤 "(이름)" 형식 모두 지원)
        const parsed = parseEventTitle(event.title || '')
        const cleanTitle = parsed.content
        setOwnerName(parsed.name || event.userName || currentUser?.name || '')
        
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
          recurrenceType: 'NONE',
          recurrenceEndMode: 'count',
          recurrenceCount: 10,
          recurrenceUntil: '',
        })
      } else {
        // 신규 등록 시: 시작일을 선택한 날짜로 설정, 종료일도 시작일과 동일
        const selectedDate = event?.start ? new Date(event.start) : new Date()
        const startDateStr = formatDate(selectedDate)
        
        // 신규 등록 시 기본적으로 종일 설정 (09:00-18:00)
        const startTime = '09:00'
        const endTime = '18:00'
        
        setOwnerName(currentUser?.name || '')
        setFormData({
          title: '',
          startDate: startDateStr,
          endDate: startDateStr, // 종료일을 시작일과 동일하게 설정 (event.end 무시)
          startTime: startTime,
          endTime: endTime,
          eventType: 'VACATION',
          description: '',
          teamId: getUserTeamId(),
          recurrenceType: 'NONE',
          recurrenceEndMode: 'count',
          recurrenceCount: 10,
          recurrenceUntil: '',
        })
      }
    } else {
      // event가 없는 경우 (직접 모달 열기)
      // 날짜를 클릭해 여는 경우와 기본 시간을 맞춘다 (종일 09:00-18:00)
      const today = new Date()
      const startDateStr = formatDate(today)
      const startTime = '09:00'
      const endTime = '18:00'
      
      setOwnerName(currentUser?.name || '')
      setFormData({
        title: '',
        startDate: startDateStr,
        endDate: startDateStr,
        startTime: startTime,
        endTime: endTime,
        eventType: 'VACATION',
        description: '',
        teamId: getUserTeamId(),
        recurrenceType: 'NONE',
        recurrenceEndMode: 'count',
        recurrenceCount: 10,
        recurrenceUntil: '',
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
    // 작성자 이름을 제목 앞에 결합: "(이름) 내용"
    const finalTitle = buildEventTitle(ownerName, formData.title)
    // 반복 일정 정보 (신규 등록 + 반복 선택 시에만)
    const recurrence =
      !isEditMode && formData.recurrenceType !== 'NONE'
        ? {
            type: formData.recurrenceType,
            endMode: formData.recurrenceEndMode,
            count: Number(formData.recurrenceCount) || 1,
            until: formData.recurrenceUntil || null,
          }
        : null

    onSave({
      ...formData,
      title: finalTitle,
      recurrence,
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
            <div className="flex items-stretch">
              {ownerName && (
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-sm whitespace-nowrap select-none">
                  ({ownerName})
                </span>
              )}
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`input-field ${ownerName ? 'rounded-l-none' : ''}`}
                placeholder="내용을 입력하세요"
                required
              />
            </div>
            {ownerName && (
              <p className="mt-1 text-xs text-gray-400">
                이름은 자동으로 제목 앞에 표시됩니다. 내용만 입력하세요.
              </p>
            )}
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
                  const newEndDate = formData.endDate < newStartDate ? newStartDate : formData.endDate
                  setFormData({ ...formData, startDate: newStartDate, endDate: newEndDate })
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
                  setFormData({ ...formData, endDate: e.target.value })
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

          {!isEditMode && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Repeat className="w-4 h-4 inline mr-1" />
                  반복
                </label>
                <select
                  value={formData.recurrenceType}
                  onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                  className="input-field"
                >
                  <option value="NONE">반복 안 함</option>
                  <option value="WEEKLY">매주</option>
                  <option value="MONTHLY">매월</option>
                  <option value="YEARLY">매년</option>
                </select>
              </div>

              {formData.recurrenceType !== 'NONE' && (
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="recurrenceEndMode"
                        value="count"
                        checked={formData.recurrenceEndMode === 'count'}
                        onChange={(e) => setFormData({ ...formData, recurrenceEndMode: e.target.value })}
                      />
                      횟수 지정
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="recurrenceEndMode"
                        value="until"
                        checked={formData.recurrenceEndMode === 'until'}
                        onChange={(e) => setFormData({ ...formData, recurrenceEndMode: e.target.value })}
                      />
                      종료일 지정
                    </label>
                  </div>

                  {formData.recurrenceEndMode === 'count' ? (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">반복 횟수 (최초 포함)</label>
                      <input
                        type="number"
                        min="1"
                        max="366"
                        value={formData.recurrenceCount}
                        onChange={(e) => setFormData({ ...formData, recurrenceCount: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">반복 종료일</label>
                      <input
                        type="date"
                        value={formData.recurrenceUntil}
                        min={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, recurrenceUntil: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

