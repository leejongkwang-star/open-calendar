# 직원번호 중복 확인 오류 코드 점검 결과

## 🔍 문제 상황

- ✅ 직원번호 입력 시 자동 중복 확인: **정상 작동**
- ❌ 회원가입 버튼 클릭 시: **오류 발생**
- ❌ 직원번호 입력 후 엔터 입력 시: **오류 발생**
- ❌ 기존 직원번호든 새로운 직원번호든 모두 오류 발생

## 📋 코드 분석 결과

### 1. `checkEmployeeNumberAvailability` 함수 (81-122줄)

```javascript
const checkEmployeeNumberAvailability = async (employeeNumber) => {
  // ... 검증 로직 ...
  
  try {
    const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
    
    let exists = false
    if (USE_MOCK) {
      // 모크 모드: 정상
      exists = users.some(...)
    } else {
      // 실제 API 호출
      const response = await authAPI.checkEmployeeNumber(employeeNumber)
      exists = response.exists  // ⚠️ 문제 가능성 1
    }
    
    const isAvailable = !exists
    setEmployeeNumberChecked(isAvailable)  // ⚠️ 문제 가능성 2
    
    // ... 에러 설정 ...
    
    return { success: true, exists, available: isAvailable }
  } catch (error) {
    // 에러 처리
    setEmployeeNumberChecked(false)
    return { success: false, exists: null, available: false, error: error.message }
  }
}
```

**발견된 문제점:**

#### ⚠️ 문제 1: `response.exists` 접근 방식

**현재 코드:**
```javascript
const response = await authAPI.checkEmployeeNumber(employeeNumber)
exists = response.exists
```

**`authAPI.checkEmployeeNumber` 구현:**
```javascript
checkEmployeeNumber: async (employeeNumber) => {
  const response = await api.get('/auth/check-employee-number', { params: { employeeNumber } })
  return response.data  // response.data를 반환
}
```

**백엔드 응답:**
```javascript
res.json({ exists: !!user })  // { exists: true/false }
```

**분석:**
- `response.data`는 `{ exists: true/false }`
- 따라서 `response.exists`는 `undefined`가 될 수 있음
- 올바른 접근: `response.exists` 또는 `response?.exists`

**예상 시나리오:**
- API 응답이 `{ exists: false }`인 경우: `response.exists === false` ✅ 정상
- API 응답이 `{ exists: true }`인 경우: `response.exists === true` ✅ 정상
- API 응답 형식이 다른 경우: `response.exists === undefined` ❌ 오류

#### ⚠️ 문제 2: `setEmployeeNumberChecked` 로직

**현재 코드:**
```javascript
const isAvailable = !exists
setEmployeeNumberChecked(isAvailable)
```

**분석:**
- `exists === false` (사용 가능) → `isAvailable = true` → `employeeNumberChecked = true` ✅
- `exists === true` (중복) → `isAvailable = false` → `employeeNumberChecked = false` ✅

**문제점:**
- 중복인 경우 `employeeNumberChecked = false`로 설정됨
- 그런데 `handleSubmit`에서는 `if (!employeeNumberChecked)` 조건 사용
- 즉, 중복인 경우에도 다시 확인을 시도함 → 불필요한 재확인

#### ⚠️ 문제 3: `handleSubmit`의 조건 로직 (178-196줄)

**현재 코드:**
```javascript
// 직원번호 중복 확인
if (!employeeNumberChecked) {
  const result = await checkEmployeeNumberAvailability(formData.employeeNumber)
  if (!result.success || result.exists) {
    if (!result.success) {
      // 오류 메시지 표시
      setErrors(prev => ({ 
        ...prev, 
        employeeNumber: '직원번호 중복 확인 중 오류가 발생했습니다. 다시 시도해주세요.' 
      }))
    } else if (result.exists) {
      // 에러는 이미 함수 내부에서 설정됨
    } else {
      setErrors(prev => ({ 
        ...prev, 
        employeeNumber: '직원번호 중복 확인이 필요합니다.' 
      }))
    }
    return
  }
}
```

**문제점 분석:**

1. **`if (!result.success || result.exists)` 조건:**
   - `!result.success` (오류) → 오류 메시지 표시 ✅
   - `result.exists` (중복) → 중복 메시지 표시 ✅
   - `result.success === true && result.exists === false` (사용 가능) → 통과 ✅

2. **하지만 실제 문제:**
   - `result.success === false`인 경우, catch 블록에서 이미 에러 메시지를 설정했음
   - `handleSubmit`에서 또 다시 에러 메시지를 설정 → 중복 (하지만 이건 큰 문제는 아님)

3. **실제 오류 발생 가능 시나리오:**
   - API 호출 실패 (네트워크 오류, 서버 오류 등)
   - `catch` 블록에서 `setErrors`로 에러 메시지 설정
   - `return { success: false, ... }` 반환
   - `handleSubmit`에서 `!result.success`가 `true`이므로 또 에러 메시지 설정
   - 하지만 이것도 큰 문제는 아님 (이미 함수 내부에서 설정했으니)

### 2. API 응답 형식 불일치 가능성

**백엔드 응답 (`auth.js` 43줄):**
```javascript
res.json({ exists: !!user })
```

**프론트엔드 접근 (`SignupPage.jsx` 98줄):**
```javascript
const response = await authAPI.checkEmployeeNumber(employeeNumber)
exists = response.exists
```

**`authAPI.checkEmployeeNumber` (`auth.js` 9-12줄):**
```javascript
checkEmployeeNumber: async (employeeNumber) => {
  const response = await api.get('/auth/check-employee-number', { params: { employeeNumber } })
  return response.data  // { exists: true/false }
}
```

**분석:**
- `response.data`는 `{ exists: true/false }` ✅
- 따라서 `response.exists` 접근은 정상 ✅

**하지만 잠재적 문제:**
- Axios 인터셉터에서 `response.data`를 수정하는 경우
- 백엔드가 다른 형식으로 응답하는 경우 (예: `{ data: { exists: ... } }`)
- 네트워크 오류로 `response.data`가 `undefined`인 경우

### 3. 엔터 키 입력 처리

**코드에서 엔터 키 처리 확인:**
- `SignupPage.jsx`에 `onKeyDown` 또는 `onKeyPress` 이벤트 핸들러가 없음
- `<form>`의 기본 동작으로 `onSubmit`이 트리거됨
- 따라서 엔터 입력 시 `handleSubmit`이 호출됨 ✅

## 🎯 실제 문제 원인 추정

### 추정 1: API 응답 형식 문제

**가능성:** `response.exists`가 `undefined`인 경우
- 백엔드 응답이 `{ exists: true/false }`가 아닌 다른 형식
- Axios가 응답을 변환하는 과정에서 문제
- 네트워크 오류로 `response`가 제대로 받아지지 않음

**확인 방법:**
```javascript
const response = await authAPI.checkEmployeeNumber(employeeNumber)
console.log('API 응답:', response)
console.log('response.exists:', response.exists)
```

### 추정 2: 비동기 상태 업데이트 문제

**가능성:** `checkEmployeeNumberAvailability`가 완료되기 전에 `handleSubmit`이 진행됨
- 하지만 `await`를 사용하고 있으므로 이 가능성은 낮음

### 추정 3: 에러 처리 중 상태 불일치

**가능성:** API 호출 실패 시 `setEmployeeNumberChecked(false)`로 설정되지만, 에러 메시지가 제대로 표시되지 않음
- 하지만 코드상으로는 에러 메시지가 설정됨

## 🔍 확인이 필요한 부분

### 1. 실제 API 응답 확인

**브라우저 개발자 도구에서 확인:**
1. Network 탭에서 `/auth/check-employee-number` 요청 확인
2. 응답 본문 (Response) 확인
3. 콘솔에서 `console.log('API 응답:', response)` 출력 확인

### 2. 에러 상세 정보 확인

**현재 코드에 콘솔 로그가 있음:**
```javascript
console.error('직원번호 확인 실패:', error)
```

**브라우저 콘솔에서 확인:**
- 실제 에러 메시지
- 에러 객체의 구조
- `error.response?.data` 내용

### 3. `employeeNumberChecked` 상태 확인

**회원가입 버튼 클릭 시:**
- `employeeNumberChecked`가 `true`인지 `false`인지
- 자동 확인이 완료되었는지 확인

## 💡 해결 방향 (수정하지 말고 참고만)

### 방향 1: 응답 형식 명시적 확인

```javascript
const response = await authAPI.checkEmployeeNumber(employeeNumber)
if (!response || typeof response.exists !== 'boolean') {
  throw new Error('서버 응답 형식이 올바르지 않습니다.')
}
exists = response.exists
```

### 방향 2: 에러 처리 개선

```javascript
catch (error) {
  console.error('직원번호 확인 실패:', error)
  console.error('에러 상세:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status,
    code: error.code
  })
  // ...
}
```

### 방향 3: `handleSubmit` 조건 개선

```javascript
if (!employeeNumberChecked) {
  const result = await checkEmployeeNumberAvailability(formData.employeeNumber)
  if (!result.success) {
    // 오류 발생 - 이미 함수 내부에서 에러 메시지 설정됨
    return
  }
  if (result.exists) {
    // 중복 - 이미 함수 내부에서 에러 메시지 설정됨
    return
  }
  // 사용 가능한 경우만 통과
}
```

## 📝 체크리스트

다음 사항들을 확인해야 합니다:

- [ ] 브라우저 콘솔에서 실제 에러 메시지 확인
- [ ] Network 탭에서 API 응답 본문 확인
- [ ] `response.exists` 값이 실제로 `undefined`인지 확인
- [ ] API 호출이 실제로 실패하는지 확인 (네트워크 오류 등)
- [ ] `employeeNumberChecked` 상태가 올바르게 업데이트되는지 확인

---

**다음 단계: 브라우저 개발자 도구에서 실제 에러와 응답을 확인하세요!**

