# 직원번호 중복 확인 수정 방안 선택 가이드

## 🔴 현재 문제점
- React 상태 업데이트 타이밍 문제로 중복 확인 후에도 "중복 확인이 필요합니다" 에러가 발생
- `await` 이후에도 상태가 즉시 반영되지 않음

---

## 📋 수정 방안 선택

### **방안 1: 함수가 결과를 반환하도록 수정 (권장 ⭐⭐⭐)**

**난이도**: ⭐⭐ (보통)  
**효과**: ⭐⭐⭐⭐⭐ (완벽 해결)  
**추천도**: ⭐⭐⭐⭐⭐

**장점:**
- 가장 확실하고 안전한 해결 방법
- 비동기 상태 문제 완전 해결
- 결과를 직접 확인 가능
- 코드가 명확하고 이해하기 쉬움

**단점:**
- 함수 구조 변경 필요

**수정 범위:**
- `checkEmployeeNumberAvailability` 함수 수정
- `handleSubmit` 함수 수정

**예상 수정 시간**: 10-15분

---

### **방안 2: useRef로 최신 상태 추적**

**난이도**: ⭐⭐ (보통)  
**효과**: ⭐⭐⭐⭐ (거의 완벽)  
**추천도**: ⭐⭐⭐

**장점:**
- 기존 함수 구조 유지
- ref를 통해 항상 최신 값 접근 가능
- 빠른 수정 가능

**단점:**
- ref와 state 두 가지를 관리해야 함
- 코드 복잡도 약간 증가

**수정 범위:**
- `useRef` 추가
- `checkEmployeeNumberAvailability` 함수 수정
- `handleSubmit` 함수 수정

**예상 수정 시간**: 10분

---

### **방안 3: 제출 시 중복 확인 생략 (간단한 방법)**

**난이도**: ⭐ (쉬움)  
**효과**: ⭐⭐⭐ (부분 해결)  
**추천도**: ⭐⭐

**장점:**
- 가장 간단한 수정
- 코드 변경 최소화

**단점:**
- 제출 시점에 중복 확인을 하지 않아 보안성 약간 저하
- 백엔드에서 중복 체크는 여전히 수행됨
- `onBlur` 확인을 안 한 경우 문제 가능

**수정 범위:**
- `handleSubmit`의 중복 확인 체크 제거

**예상 수정 시간**: 2분

---

### **방안 4: 로딩 상태 추가 + 결과 반환 조합 (완벽한 UX)**

**난이도**: ⭐⭐⭐ (조금 어려움)  
**효과**: ⭐⭐⭐⭐⭐ (완벽 해결 + UX 개선)  
**추천도**: ⭐⭐⭐⭐⭐

**장점:**
- 방안 1의 모든 장점
- 사용자 경험 크게 개선
- 로딩 중 표시로 명확한 피드백

**단점:**
- 수정 범위가 약간 넓음
- UI 요소 추가 필요

**수정 범위:**
- 방안 1 + 로딩 상태 추가
- UI에 로딩 표시 추가

**예상 수정 시간**: 20-25분

---

### **방안 5: Debounce + 자동 확인 + 결과 반환 (가장 완벽)**

**난이도**: ⭐⭐⭐⭐ (어려움)  
**효과**: ⭐⭐⭐⭐⭐ (최고 UX)  
**추천도**: ⭐⭐⭐⭐

**장점:**
- 6자리 입력 완료 시 자동 중복 확인
- 불필요한 API 호출 감소
- 사용자가 별도로 포커스 아웃할 필요 없음
- 최고의 사용자 경험

**단점:**
- 구현 복잡도 높음
- 디바운스 로직 추가 필요

**수정 범위:**
- 방안 1 + Debounce 로직
- `onChange` 핸들러 수정
- 타이머 관리

**예상 수정 시간**: 30-40분

---

## 🎯 추천 순서

1. **방안 1** (결과 반환) - 가장 확실하고 빠른 해결
2. **방안 4** (로딩 + 결과 반환) - 방안 1 + UX 개선
3. **방안 2** (useRef) - 빠른 수정이 필요할 때
4. **방안 5** (Debounce) - 완벽한 UX를 원할 때
5. **방안 3** (간단 제거) - 임시 조치용

---

## 📝 각 방안 상세 코드 예시

### 방안 1: 함수가 결과를 반환

```javascript
// checkEmployeeNumberAvailability 수정
const checkEmployeeNumberAvailability = async (employeeNumber) => {
  if (!employeeNumber || !validateEmployeeNumber(employeeNumber)) {
    return { success: false, exists: null, available: false }
  }

  try {
    const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
    
    let exists = false
    if (USE_MOCK) {
      const users = JSON.parse(localStorage.getItem('mock-users') || '[]')
      exists = users.some((u) => u.employeeNumber === employeeNumber)
    } else {
      const response = await authAPI.checkEmployeeNumber(employeeNumber)
      exists = response.exists
    }
    
    const isAvailable = !exists
    setEmployeeNumberChecked(isAvailable)
    
    if (exists) {
      setErrors(prev => ({ ...prev, employeeNumber: '이미 사용 중인 직원번호입니다.' }))
    } else {
      setErrors(prev => ({ ...prev, employeeNumber: '' }))
    }
    
    return { success: true, exists, available: isAvailable }
  } catch (error) {
    console.error('직원번호 확인 실패:', error)
    setErrors(prev => ({ 
      ...prev, 
      employeeNumber: '직원번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.' 
    }))
    return { success: false, exists: null, available: false, error: error.message }
  }
}

// handleSubmit 수정
if (!employeeNumberChecked) {
  const result = await checkEmployeeNumberAvailability(formData.employeeNumber)
  if (!result.success || result.exists) {
    return // 에러는 이미 함수 내부에서 설정됨
  }
}
```

### 방안 2: useRef 사용

```javascript
// 상단에 추가
const employeeNumberCheckedRef = useRef(false)

// checkEmployeeNumberAvailability 수정 (기존과 동일하되)
const checkEmployeeNumberAvailability = async (employeeNumber) => {
  // ... 기존 코드 ...
  employeeNumberCheckedRef.current = !exists  // 추가
  setEmployeeNumberChecked(!exists)
  // ...
}

// handleSubmit 수정
if (!employeeNumberCheckedRef.current) {
  await checkEmployeeNumberAvailability(formData.employeeNumber)
  if (!employeeNumberCheckedRef.current) {
    setErrors(prev => ({ 
      ...prev, 
      employeeNumber: '직원번호 중복 확인이 필요합니다.' 
    }))
    return
  }
}
```

### 방안 3: 제출 시 중복 확인 제거

```javascript
// handleSubmit에서 이 부분 삭제
// if (!employeeNumberChecked) {
//   await checkEmployeeNumberAvailability(formData.employeeNumber)
//   if (!employeeNumberChecked) {
//     setErrors({ ...errors, employeeNumber: '직원번호 중복 확인이 필요합니다.' })
//     return
//   }
// }
```

---

## 🤔 선택 가이드

**빠르게 해결하고 싶다면?** → **방안 1**  
**UX도 개선하고 싶다면?** → **방안 4**  
**최소한의 수정만 원한다면?** → **방안 3**  
**가장 완벽한 경험을 원한다면?** → **방안 5**

어떤 방안으로 수정할지 알려주세요!

