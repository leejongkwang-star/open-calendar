import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../api/auth'
import { mockSignup, loadMockData } from '../utils/mockData'
import { Hash, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

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
    // 직원번호는 대문자로 변환
    if (field === 'employeeNumber') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    }
    setFormData({ ...formData, [field]: value })
    // 실시간 검증
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const checkEmployeeNumberAvailability = async (employeeNumber) => {
    if (!employeeNumber || !validateEmployeeNumber(employeeNumber)) {
      return
    }

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        // 모크 모드: 로컬 스토리지에서 확인
        const users = JSON.parse(localStorage.getItem('mock-users') || '[]')
        const exists = users.some((u) => u.employeeNumber === employeeNumber)
        setEmployeeNumberChecked(!exists)
        if (exists) {
          setErrors({ ...errors, employeeNumber: '이미 사용 중인 직원번호입니다.' })
        } else {
          setErrors({ ...errors, employeeNumber: '' })
        }
      } else {
        // 실제 API 호출
        const response = await authAPI.checkEmployeeNumber(employeeNumber)
        setEmployeeNumberChecked(!response.exists)
        if (response.exists) {
          setErrors({ ...errors, employeeNumber: '이미 사용 중인 직원번호입니다.' })
        } else {
          setErrors({ ...errors, employeeNumber: '' })
        }
      }
    } catch (error) {
      console.error('직원번호 확인 실패:', error)
    }
  }

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
      await checkEmployeeNumberAvailability(formData.employeeNumber)
      if (!employeeNumberChecked) {
        setErrors({ ...errors, employeeNumber: '직원번호 중복 확인이 필요합니다.' })
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
                  onChange={(e) => {
                    handleChange('employeeNumber', e.target.value)
                    setEmployeeNumberChecked(false)
                  }}
                  onBlur={() => checkEmployeeNumberAvailability(formData.employeeNumber)}
                  className={`input-field pl-10 uppercase ${errors.employeeNumber ? 'border-red-500' : employeeNumberChecked ? 'border-green-500' : ''}`}
                  placeholder="A1B2C3"
                  maxLength={6}
                  required
                />
                {employeeNumberChecked && !errors.employeeNumber && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
              </div>
              {errors.employeeNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeNumber}</p>
              )}
              {employeeNumberChecked && !errors.employeeNumber && (
                <p className="mt-1 text-sm text-green-600">사용 가능한 직원번호입니다.</p>
              )}
              {!errors.employeeNumber && formData.employeeNumber && (
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
