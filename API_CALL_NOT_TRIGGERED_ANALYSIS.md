# API 호출이 발생하지 않는 문제 분석

## 🔴 문제 상황

- 네트워크 탭에서 `/auth/check-employee-number` 요청이 발생하지 않음
- 회원가입 버튼 클릭 시 또는 엔터 입력 시 오류 발생
- API 호출 자체가 실행되지 않음

## 🎯 발견된 문제

### ⚠️ 문제 1: `validateEmployeeNumber` 검증 로직 오류 (82줄)

**현재 코드:**
```javascript
const checkEmployeeNumberAvailability = async (employeeNumber) => {
  if (!employeeNumber || !validateEmployeeNumber(employeeNumber)) {
    return { success: false, exists: null, available: false }
  }
  // ...
}
```

**`validateEmployeeNumber` 함수 (35-51줄):**
```javascript
const validateEmployeeNumber = (employeeNumber) => {
  if (!employeeNumber) {
    return '직원번호를 입력해주세요.'  // 에러 메시지 반환
  }
  // ...
  if (!employeeNumberRegex.test(employeeNumber)) {
    return '직원번호는 6자리 영문과 숫자 조합이어야 합니다.'  // 에러 메시지 반환
  }
  // ...
  return ''  // 검증 성공 시 빈 문자열 반환
}
```

**문제 분석:**

1. **`validateEmployeeNumber`의 반환값:**
   - 검증 실패: 에러 메시지 문자열 반환 (예: `'직원번호를 입력해주세요.'`)
   - 검증 성공: 빈 문자열 `''` 반환

2. **`!validateEmployeeNumber(employeeNumber)` 평가:**
   - 검증 실패 시: `!'에러 메시지'` → `false` → 함수 계속 진행 ✅
   - 검증 성공 시: `!''` → `true` → **early return** ❌

3. **결과:**
   - 검증이 **성공**하면 함수가 일찍 종료되어 API 호출을 하지 않음
   - 검증이 **실패**하면 함수가 계속 진행 (이것도 잘못됨)

**의도한 동작:**
- 검증 실패 시 → early return
- 검증 성공 시 → API 호출 진행

**올바른 로직:**
```javascript
if (!employeeNumber || validateEmployeeNumber(employeeNumber)) {
  // validateEmployeeNumber가 빈 문자열이 아니면 (검증 실패)
  return { success: false, exists: null, available: false }
}
```

또는:

```javascript
const validationError = validateEmployeeNumber(employeeNumber)
if (!employeeNumber || validationError) {
  return { success: false, exists: null, available: false }
}
```

### ⚠️ 문제 2: `handleSubmit`에서의 조건 (178줄)

**현재 코드:**
```javascript
// 직원번호 중복 확인
if (!employeeNumberChecked) {
  const result = await checkEmployeeNumberAvailability(formData.employeeNumber)
  // ...
}
```

**문제:**
- `employeeNumberChecked`가 `true`이면 (이미 자동 확인 완료) 이 블록을 건너뜀
- 하지만 자동 확인이 완료되어도, 제출 시 다시 확인하는 것이 안전할 수 있음
- 그러나 현재는 문제 1 때문에 API 호출이 안 되는 것이 더 큰 문제

## 📋 전체 실행 흐름

### 시나리오: 회원가입 버튼 클릭

1. `handleSubmit` 호출 (177줄)
2. 전체 검증 수행 (180-193줄)
   - `validateEmployeeNumber(formData.employeeNumber)` 호출
   - 검증 성공 시 빈 문자열 `''` 반환
   - 검증 실패 시 에러 메시지 반환
3. `if (!employeeNumberChecked)` 조건 확인 (178줄)
   - `employeeNumberChecked`가 `false`이면 → `checkEmployeeNumberAvailability` 호출
4. `checkEmployeeNumberAvailability` 함수 내부 (81줄):
   ```javascript
   if (!employeeNumber || !validateEmployeeNumber(employeeNumber)) {
     return { success: false, exists: null, available: false }
   }
   ```
   - **여기서 문제 발생!**
   - `validateEmployeeNumber`가 `''` 반환 (검증 성공)
   - `!''` → `true`
   - 조건이 `true`가 되어 early return
   - **API 호출 경로에 도달하지 못함**

## 🔍 확인 방법

브라우저 콘솔에서 다음을 확인:

```javascript
// 1. 환경 변수 확인
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK)

// 2. validateEmployeeNumber 테스트
// (SignupPage 컴포넌트 외부에서는 접근 불가하지만, 코드에서 직접 확인)
```

## ✅ 해결 방안

### 방안 1: 검증 로직 수정 (권장)

```javascript
const checkEmployeeNumberAvailability = async (employeeNumber) => {
  // validateEmployeeNumber는 에러 메시지를 반환하므로, 빈 문자열이 아니면 검증 실패
  const validationError = validateEmployeeNumber(employeeNumber)
  if (!employeeNumber || validationError) {
    return { success: false, exists: null, available: false }
  }

  setCheckingEmployeeNumber(true)
  try {
    const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
    
    let exists = false
    if (USE_MOCK) {
      // 모크 모드
      const users = JSON.parse(localStorage.getItem('mock-users') || '[]')
      exists = users.some((u) => u.employeeNumber === employeeNumber.toUpperCase())
    } else {
      // 실제 API 호출
      const response = await authAPI.checkEmployeeNumber(employeeNumber)
      exists = response.exists
    }
    
    // ... 나머지 로직
  } catch (error) {
    // ... 에러 처리
  }
}
```

### 방안 2: validateEmployeeNumber를 boolean 반환으로 수정

```javascript
const validateEmployeeNumber = (employeeNumber) => {
  if (!employeeNumber) {
    return false  // 또는 { valid: false, error: '직원번호를 입력해주세요.' }
  }
  // ...
  return true  // 검증 성공
}
```

하지만 이 방법은 다른 곳에서도 `validateEmployeeNumber`를 사용하고 있을 수 있으므로, 방안 1이 더 안전합니다.

## 🎯 핵심 문제

**`!validateEmployeeNumber(employeeNumber)` 조건이 반대로 되어 있음**

- 현재: 검증 성공 시 `true`가 되어 early return
- 올바름: 검증 실패 시 `true`가 되어 early return

## 📝 체크리스트

- [ ] `validateEmployeeNumber`의 반환값 확인 (에러 메시지 vs 빈 문자열)
- [ ] `!validateEmployeeNumber(...)` 조건 로직 확인
- [ ] API 호출 경로에 도달하는지 확인
- [ ] `USE_MOCK` 조건이 올바른지 확인

---

**핵심 문제: 82줄의 `!validateEmployeeNumber(employeeNumber)` 조건이 반대로 되어 있어, 검증 성공 시 API 호출을 하지 않습니다!**

