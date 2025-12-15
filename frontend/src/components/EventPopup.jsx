import { useEffect, useRef } from 'react'
import { Edit, Trash2, MessageCircle, MoreVertical, X } from 'lucide-react'
import { toKoreanEventType } from '../utils/eventTypeMapping'

function EventPopup({ event, position, onClose, onEdit, onDelete, onMessage }) {
  const popupRef = useRef(null)

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose()
      }
    }

    // Escape 키로 닫기
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!event) return null

  // 날짜 포맷팅
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const weekday = weekdays[d.getDay()]
    return `${month}월 ${day}일 (${weekday})`
  }

  // 이벤트 타입별 색상
  const getEventColor = (eventType) => {
    const colors = {
      VACATION: '#2563eb',
      MEETING: '#059669',
      TRAINING: '#ea580c',
      BUSINESS_TRIP: '#0891b2',
      OTHER: '#7c3aed',
    }
    return colors[eventType] || '#4b5563'
  }

  // 팝업 위치 조정 (화면 밖으로 나가지 않도록)
  const adjustPosition = (pos) => {
    const popupWidth = 320
    const popupHeight = 200
    const padding = 10

    let { x, y } = pos

    // 오른쪽 경계 체크
    if (x + popupWidth > window.innerWidth) {
      x = window.innerWidth - popupWidth - padding
    }

    // 왼쪽 경계 체크
    if (x < padding) {
      x = padding
    }

    // 아래쪽 경계 체크
    if (y + popupHeight > window.innerHeight) {
      y = pos.y - popupHeight - 40 // 이벤트 위로 표시
    }

    // 위쪽 경계 체크
    if (y < padding) {
      y = padding
    }

    return { x, y }
  }

  const adjustedPosition = adjustPosition(position)
  const eventColor = getEventColor(event.eventType)

  return (
    <div
      ref={popupRef}
      className="event-popup"
      style={{
        position: 'fixed',
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
        zIndex: 1000,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        minWidth: '280px',
        maxWidth: '320px',
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      {/* 상단 아이콘 바 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      >
        <button
          onClick={onEdit}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280',
          }}
          title="편집"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280',
          }}
          title="삭제"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={onMessage}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280',
          }}
          title="SMS"
        >
          <MessageCircle size={16} />
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280',
          }}
          title="더보기"
        >
          <MoreVertical size={16} />
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280',
          }}
          title="닫기"
        >
          <X size={16} />
        </button>
      </div>

      {/* 이벤트 정보 */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* 색상 인디케이터 */}
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: eventColor,
              flexShrink: 0,
              marginTop: '4px',
            }}
          />

          {/* 이벤트 내용 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 제목 */}
            <div
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px',
                wordBreak: 'break-word',
              }}
            >
              {event.title?.replace(/\s*\([^)]+\)\s*$/, '') || '제목 없음'}
            </div>

            {/* 날짜 */}
            <div
              style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {(() => {
                // originalStartDate, originalEndDate는 백엔드 원본 날짜 (UTC 기준 날짜만 추출된 값)
                // event.end는 react-big-calendar용으로 종료일 다음 날이므로 사용하지 않음
                const startDate = event.originalStartDate ? new Date(event.originalStartDate) : (event.startDate ? new Date(event.startDate) : (event.start ? new Date(event.start) : null))
                const actualEndDate = event.originalEndDate ? new Date(event.originalEndDate) : null
                
                if (!startDate || !actualEndDate) {
                  return <span>{formatDate(event.start || event.startDate)}</span>
                }
                
                // UTC 기준으로 날짜만 비교 (시간 제외)
                // originalStartDate, originalEndDate는 이미 UTC 기준 날짜만 추출된 값이므로 그대로 사용
                const startUTCDate = startDate.getUTCFullYear() * 10000 + (startDate.getUTCMonth() + 1) * 100 + startDate.getUTCDate()
                const endUTCDate = actualEndDate.getUTCFullYear() * 10000 + (actualEndDate.getUTCMonth() + 1) * 100 + actualEndDate.getUTCDate()
                const isSameDay = startUTCDate === endUTCDate
                
                // 표시용 날짜는 로컬 시간 기준으로 포맷팅
                // UTC 날짜를 로컬 시간으로 변환하여 표시
                const displayStartDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
                const displayEndDate = new Date(actualEndDate.getUTCFullYear(), actualEndDate.getUTCMonth(), actualEndDate.getUTCDate())
                
                if (isSameDay) {
                  // 하루짜리 일정: 시작일만 표시
                  return <span>{formatDate(displayStartDate)}</span>
                } else {
                  // 여러 날짜 일정: 시작일 ~ 종료일 표시
                  return <span>{formatDate(displayStartDate)} ~ {formatDate(displayEndDate)}</span>
                }
              })()}
            </div>

            {/* 참석자/생성자 */}
            {event.userName && (
              <div
                style={{
                  fontSize: '14px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px',
                }}
              >
                <span style={{ fontWeight: '500' }}>
                  {String(event.userName || '').toUpperCase()}
                </span>
              </div>
            )}

            {/* 이벤트 타입 */}
            {event.eventType && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginTop: '4px',
                }}
              >
                {toKoreanEventType(event.eventType)}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .event-popup button:hover {
          color: #111827 !important;
          background-color: #f3f4f6;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

export default EventPopup

