import { X } from 'lucide-react'
import { getMockMembers } from '../utils/mockData'
import { EVENT_TYPE_OPTIONS, toKoreanEventType } from '../utils/eventTypeMapping'

function FilterPanel({ filters, onFiltersChange, onClose }) {
  const handleMemberToggle = (memberId) => {
    const newMembers = filters.members.includes(memberId)
      ? filters.members.filter((id) => id !== memberId)
      : [...filters.members, memberId]
    onFiltersChange({ ...filters, members: newMembers })
  }

  const handleEventTypeToggle = (eventType) => {
    const newTypes = filters.eventTypes.includes(eventType)
      ? filters.eventTypes.filter((type) => type !== eventType)
      : [...filters.eventTypes, eventType]
    onFiltersChange({ ...filters, eventTypes: newTypes })
  }

  const resetFilters = () => {
    onFiltersChange({
      members: [],
      eventTypes: ['VACATION', 'MEETING', 'OTHER'],
    })
  }

  // 모크 데이터에서 구성원 목록 가져오기
  const mockMembers = getMockMembers()
  const members = mockMembers.map((m) => ({ id: m.id, name: m.name }))

  // 이벤트 타입은 영문 값 사용
  const eventTypes = ['VACATION', 'MEETING', 'OTHER']

  return (
    <div className="card mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">필터</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* 구성원 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            구성원
          </label>
          <div className="space-y-2">
            {members.map((member) => (
              <label key={member.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.members.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{member.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 일정 유형 필터 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            일정 유형
          </label>
          <div className="space-y-2">
            {eventTypes.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.eventTypes.includes(type)}
                  onChange={() => handleEventTypeToggle(type)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{toKoreanEventType(type)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 필터 초기화 */}
        <button
          onClick={resetFilters}
          className="w-full btn-secondary text-sm"
        >
          필터 초기화
        </button>
      </div>
    </div>
  )
}

export default FilterPanel

