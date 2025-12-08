// eventType 영문-한글 매핑
export const EVENT_TYPE_MAP = {
  VACATION: '휴가',
  MEETING: '회의',
  OTHER: '기타',
}

// 한글 → 영문 변환
export const toEnglishEventType = (koreanType) => {
  const reverseMap = {
    '휴가': 'VACATION',
    '회의': 'MEETING',
    '기타': 'OTHER',
  }
  return reverseMap[koreanType] || koreanType
}

// 영문 → 한글 변환
export const toKoreanEventType = (englishType) => {
  return EVENT_TYPE_MAP[englishType] || englishType
}

// 모든 이벤트 타입 옵션 (한글 표시용)
export const EVENT_TYPE_OPTIONS = [
  { value: 'VACATION', label: '휴가' },
  { value: 'MEETING', label: '회의' },
  { value: 'OTHER', label: '기타' },
]


