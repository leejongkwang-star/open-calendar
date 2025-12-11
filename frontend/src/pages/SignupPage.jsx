import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../api/auth'
import { mockSignup, loadMockData } from '../utils/mockData'
import { Hash, Lock, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [employeeNumberChecked, setEmployeeNumberChecked] = useState(false)
  const [checkingEmployeeNumber, setCheckingEmployeeNumber] = useState(false)
  const debounceTimerRef = useRef(null)
  
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    loadMockData()
  }, [])

  const validateName = (name) => {
    if (!name || name.length < 2) {
      return '이름은 2자 이상 입력해주세요.'
    }
    return ''
  }

  const validateEmployeeNumber = (employeeNumber) => {
    if (!employeeNumber) {
      return '직원번호를 입력해주세요.'
    }
    // 6자리 영문+숫자 조합 검증
    const employeeNumberRegex = /^[A-Za-z0-9]{6}$/
    if (!employeeNumberRegex.test(employeeNumber)) {
      return '직원번호는 6자리 영문과 숫자 조합이어야 합니다.'
    }
    // 영문과 숫자가 모두 포함되어야 함
    const hasLetter = /[A-Za-z]/.test(employeeNumber)
    const hasNumber = /[0-9]/.test(employeeNumber)
    if (!hasLetter || !hasNumber) {
      return '직원번호는 영문과 숫자를 모두 포함해야 합니다.'
    }
    return ''
  }

  const validatePassword = (password) => {
    if (!password) {
      return '비밀번호를 입력해주세요.'
    }
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.'
    }
    return ''
  }

  const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      return '비밀번호 확인을 입력해주세요.'
    }
    if (password !== confirmPassword) {
      return '비밀번호가 일치하지 않습니다.'
    }
    return ''
  }

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    // 실시간 검증
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const checkEmployeeNumberAvailability = async (employeeNumber) => {
    if (!employeeNumber || !validateEmployeeNumber(employeeNumber)) {
      return { success: false, exists: null, available: false }
    }

    setCheckingEmployeeNumber(true)
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      let exists = false
      if (USE_MOCK) {
        // 모크 모드: 로컬 스토리지에서 확인
        const users = JSON.parse(localStorage.getItem('mock-users') || '[]')
        exists = users.some((u) => u.employeeNumber === employeeNumber.toUpperCase())
      } else {
        // 실제 API 호출
        try {
          const response = await authAPI.checkEmployeeNumber(employeeNumber)
          // 응답이 존재하는지 확인
          if (response && typeof response.exists === 'boolean') {
            exists = response.exists
          } else {
            console.error('예상하지 못한 API 응답 형식:', response)
            throw new Error('서버 응답 형식이 올바르지 않습니다.')
          }
        } catch (apiError) {
          // API 호출 자체가 실패한 경우 (네트워크 오류 등)
          console.error('API 호출 실패:', apiError)
          throw apiError
        }
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
      
      // 백엔드에서 반환한 구체적인 에러 메시지 사용
      const errorMessage = error.response?.data?.message 
        || error.message 
        || '직원번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.'
      
      setErrors(prev => ({ 
        ...prev, 
        employeeNumber: errorMessage
      }))
      setEmployeeNumberChecked(false)
      return { success: false, exists: null, available: false, error: errorMessage }
    } finally {
      setCheckingEmployeeNumber(false)
    }
  }

  const handleEmployeeNumberChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    
    handleChange('employeeNumber', value)
    setEmployeeNumberChecked(false)
    
    // 기존 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 에러 초기화
    if (errors.employeeNumber) {
      setErrors(prev => ({ ...prev, employeeNumber: '' }))
    }
    
    // 6자리 입력 완료 시 debounce 후 자동 확인
    if (value.length === 6) {
      debounceTimerRef.current = setTimeout(() => {
        checkEmployeeNumberAvailability(value)
      }, 500)
    }
  }

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // 전체 검증
    const nameError = validateName(formData.name)
    const employeeNumberError = validateEmployeeNumber(formData.employeeNumber)
    const passwordError = validatePassword(formData.password)
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword)

    if (nameError || employeeNumberError || passwordError || confirmPasswordError) {
      setErrors({
        name: nameError,
        employeeNumber: employeeNumberError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      })
      return
    }

    // 직원번호 중복 확인
    if (!employeeNumberChecked) {
      const result = await checkEmployeeNumberAvailability(formData.employeeNumber)
      if (!result.success || result.exists) {
        if (!result.success) {
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

    setLoading(true)

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      let response
      if (USE_MOCK) {
        response = await mockSignup(formData.name, formData.employeeNumber, formData.password)
      } else {
        response = await authAPI.signup(formData)
      }
      
      // 회원가입 성공 시 승인 대기 안내
      // 자동 로그인하지 않음
      setErrors({
        submit: 'success',
        message: response.message || '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
      })
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setErrors({
        submit: err.message || err.response?.data?.message || '회원가입에 실패했습니다.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-600">새 계정을 만들어 일정을 관리하세요</p>
          </div>

          {errors.submit && errors.submit !== 'success' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{errors.submit}</span>
            </div>
          )}
          
          {errors.submit === 'success' && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-700 mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">회원가입 완료</span>
              </div>
              <p className="text-sm text-green-600">{errors.message}</p>
              <p className="text-xs text-green-500 mt-2">잠시 후 로그인 페이지로 이동합니다...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-2">
                직원번호(사번) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="employeeNumber"
                  type="text"
                  value={formData.employeeNumber}
                  onChange={handleEmployeeNumberChange}
                  onBlur={() => {
                    // onBlur에서도 확인 (6자리가 아닌 경우 대비)
                    if (formData.employeeNumber.length === 6 && !employeeNumberChecked && !checkingEmployeeNumber) {
                      checkEmployeeNumberAvailability(formData.employeeNumber)
                    }
                  }}
                  className={`input-field pl-10 uppercase ${errors.employeeNumber ? 'border-red-500' : employeeNumberChecked ? 'border-green-500' : ''}`}
                  placeholder="A1B2C3"
                  maxLength={6}
                  required
                />
                {checkingEmployeeNumber && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 animate-spin" />
                )}
                {!checkingEmployeeNumber && employeeNumberChecked && !errors.employeeNumber && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
              </div>
              {errors.employeeNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeNumber}</p>
              )}
              {checkingEmployeeNumber && (
                <p className="mt-1 text-xs text-gray-500">중복 확인 중...</p>
              )}
              {!checkingEmployeeNumber && employeeNumberChecked && !errors.employeeNumber && (
                <p className="mt-1 text-sm text-green-600">사용 가능한 직원번호입니다.</p>
              )}
              {!checkingEmployeeNumber && !errors.employeeNumber && formData.employeeNumber && !employeeNumberChecked && (
                <p className="mt-1 text-xs text-gray-500">6자리 영문과 숫자 조합 (예: A1B2C3)</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`input-field pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="8자 이상 입력하세요"
                  required
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              {!errors.password && formData.password && (
                <p className="mt-1 text-xs text-gray-500">8자 이상 입력해주세요</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-green-500' : ''}`}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
                {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                <p className="mt-1 text-sm text-green-600">비밀번호가 일치합니다.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !formData.name || !formData.employeeNumber || !formData.password || !formData.confirmPassword}
              className="btn-primary w-full"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
