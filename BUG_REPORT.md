# 버그 리포트

**작성일**: 2025-12-19  
**테스트 범위**: 월뷰 개선 기능 (이벤트 팝업, 빈 공간 클릭)

---

## 🔴 심각 (Critical)

### BUG-001: handleSelectEvent의 이벤트 객체 접근 오류
**위치**: `캘린더프론트엔드/src/pages/CalendarPage.jsx:63-86`

**문제**:
- `react-big-calendar`의 `onSelectEvent`는 이벤트 객체만 전달하며, 두 번째 파라미터로 DOM 이벤트를 전달하지 않을 수 있습니다.
- `e?.currentTarget`이 `undefined`일 가능성이 높습니다.

**재현 단계**:
1. 월뷰에서 이벤트 클릭
2. `e.currentTarget`이 `undefined`로 인해 팝업 위치가 화면 중앙에 표시됨

**예상 영향**:
- 팝업이 클릭한 이벤트 위치가 아닌 화면 중앙에 표시되어 사용자 경험이 저하됨

**수정 제안**:
```javascript
const handleSelectEvent = (event, e) => {
  if (view === 'month') {
    // react-big-calendar는 이벤트 객체만 전달하므로
    // DOM 요소를 직접 찾아야 함
    let popupX = window.innerWidth / 2 - 160
    let popupY = window.innerHeight / 2 - 100
    
    // 이벤트 요소를 찾아서 위치 계산
    setTimeout(() => {
      const eventElements = document.querySelectorAll('.rbc-event')
      eventElements.forEach(el => {
        if (el.textContent?.includes(event.title?.replace(/\s*\([^)]+\)\s*$/, ''))) {
          const rect = el.getBoundingClientRect()
          popupX = rect.left
          popupY = rect.bottom + 5
        }
      })
      setPopupPosition({ x: popupX, y: popupY })
    }, 0)
    
    setPopupEvent(event)
    setShowEventPopup(true)
  } else {
    setSelectedEvent(event)
    setShowEventModal(true)
  }
}
```

---

## 🟡 중간 (Medium)

### BUG-002: 팝업 삭제 시 중복 확인 다이얼로그
**위치**: `캘린더프론트엔드/src/pages/CalendarPage.jsx:129-137`, `429-431`

**문제**:
- `handlePopupDelete`에서 `window.confirm`을 호출
- `handleDeleteEvent` 내부에서도 다시 `window.confirm`을 호출
- 사용자에게 두 번 확인을 요청함

**재현 단계**:
1. 월뷰에서 이벤트 클릭하여 팝업 표시
2. 삭제 버튼 클릭
3. 확인 다이얼로그가 두 번 나타남

**수정 제안**:
```javascript
// handlePopupDelete에서 확인 제거
const handlePopupDelete = () => {
  if (popupEvent?.id) {
    handleDeleteEvent(popupEvent.id)
    setShowEventPopup(false)
  }
}
```

---

### BUG-003: user가 null일 때 본인 일정 확인 로직 오류
**위치**: `캘린더프론트엔드/src/pages/CalendarPage.jsx:94-106`

**문제**:
- `user`가 `null`이거나 `undefined`일 때 `user?.id`는 `undefined`
- `event.userId !== user.id` 비교 시 `undefined !== undefined`는 `false`가 되어 모든 이벤트가 본인 일정으로 간주될 수 있음

**재현 단계**:
1. 로그인하지 않은 상태에서 월뷰 접근 (또는 user가 null인 경우)
2. 빈 공간 클릭
3. 예상과 다른 동작 발생

**수정 제안**:
```javascript
const hasMyEventsOnDate = filteredEvents.some(event => {
  if (!event.start) return false
  // user가 없으면 본인 일정 확인 불가
  if (!user?.id) return false
  // 본인의 일정인지 확인 (userId 비교)
  if (event.userId !== user.id) {
    return false
  }
  const eventDate = new Date(event.start)
  return (
    eventDate.getFullYear() === clickedDate.getFullYear() &&
    eventDate.getMonth() === clickedDate.getMonth() &&
    eventDate.getDate() === clickedDate.getDate()
  )
})
```

---

### BUG-004: 다중 날짜 이벤트 처리 누락
**위치**: `캘린더프론트엔드/src/pages/CalendarPage.jsx:94-106`

**문제**:
- `handleSelectSlot`에서 날짜 비교 시 `event.start`만 확인
- 여러 날짜에 걸친 이벤트의 경우 `event.end`도 확인해야 함
- 예: 11월 10일~12일 이벤트가 있을 때 11일을 클릭해도 감지되지 않을 수 있음

**재현 단계**:
1. 여러 날짜에 걸친 이벤트 생성 (예: 11월 10일~12일)
2. 월뷰에서 11월 11일 빈 공간 클릭
3. 이벤트가 있는 날짜임에도 일정 등록 모달이 열림

**수정 제안**:
```javascript
const hasMyEventsOnDate = filteredEvents.some(event => {
  if (!event.start) return false
  if (!user?.id) return false
  if (event.userId !== user.id) {
    return false
  }
  
  const eventStart = new Date(event.start)
  const eventEnd = event.end ? new Date(event.end) : eventStart
  const clickedDate = new Date(start)
  
  // 시작일과 종료일 사이에 클릭한 날짜가 있는지 확인
  return clickedDate >= new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()) &&
         clickedDate <= new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
})
```

---

## 🟢 경미 (Low)

### BUG-005: 팝업 위치 계산 시 스크롤 고려 안 함
**위치**: `캘린더프론트엔드/src/components/EventPopup.jsx:58-86`

**문제**:
- `getBoundingClientRect()`는 뷰포트 기준 좌표를 반환
- 페이지가 스크롤되어 있을 때 팝업 위치가 부정확할 수 있음

**재현 단계**:
1. 월뷰에서 스크롤 후 이벤트 클릭
2. 팝업 위치가 예상과 다를 수 있음

**수정 제안**:
- 현재 구현은 `position: fixed`를 사용하므로 뷰포트 기준으로 정확함
- 다만 스크롤된 상태에서 이벤트를 찾을 때는 스크롤 위치를 고려해야 함

---

### BUG-006: EventPopup의 userName이 없을 때 오류 가능성
**위치**: `캘린더프론트엔드/src/components/EventPopup.jsx:254`

**문제**:
- `event.userName.toUpperCase()` 호출 시 `userName`이 `null`이거나 `undefined`일 수 있음
- 현재는 조건부 렌더링으로 처리되어 있지만, 타입 안정성을 위해 추가 체크 필요

**재현 단계**:
1. `userName`이 없는 이벤트 클릭
2. 이론적으로는 안전하지만, 타입 체크 강화 필요

**수정 제안**:
```javascript
{event.userName && (
  <div>
    <span style={{ fontWeight: '500' }}>
      {String(event.userName).toUpperCase()}
    </span>
  </div>
)}
```

---

## 📋 테스트 체크리스트

### 월뷰 기능 테스트
- [ ] 월뷰에서 이벤트 클릭 시 팝업이 올바른 위치에 표시되는가?
- [ ] 팝업의 편집 버튼 클릭 시 수정 모달이 열리는가?
- [ ] 팝업의 삭제 버튼 클릭 시 확인 다이얼로그가 한 번만 나타나는가?
- [ ] 팝업 외부 클릭 시 팝업이 닫히는가?
- [ ] Escape 키로 팝업이 닫히는가?

### 빈 공간 클릭 테스트
- [ ] 본인 일정이 없는 날짜 클릭 시 일정 등록 모달이 열리는가?
- [ ] 본인 일정이 있는 날짜 클릭 시 일뷰로 이동하는가?
- [ ] 여러 날짜에 걸친 본인 일정이 있는 날짜 클릭 시 일뷰로 이동하는가?
- [ ] user가 null일 때 올바르게 동작하는가?

### 일/주 뷰 기능 테스트
- [ ] 일/주 뷰에서 이벤트 클릭 시 모달이 열리는가?
- [ ] 일/주 뷰에서 빈 공간 클릭 시 일정 등록 모달이 열리는가?

---

## 🔧 우선순위별 수정 권장사항

1. **즉시 수정 필요**: BUG-001, BUG-002, BUG-003
2. **단기 수정 권장**: BUG-004
3. **장기 개선 사항**: BUG-005, BUG-006

---

## 📝 추가 개선 제안

1. **에러 바운더리 추가**: 팝업 컴포넌트에 에러 핸들링 추가
2. **로딩 상태**: 삭제/편집 시 로딩 인디케이터 표시
3. **접근성**: 키보드 네비게이션 지원 (Tab, Enter, Escape)
4. **모바일 최적화**: 모바일에서 팝업 위치 및 크기 조정

