import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../api/auth'
import { Hash, Lock, AlertCircle } from 'lucide-react'
import ForgotPasswordModal from '../components/ForgotPasswordModal'

function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuthStore()


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(employeeNumber, password)
      
      login(response.user, response.token)
      navigate('/calendar', { replace: true })
    } catch (err) {
      // 백엔드에서 반환한 구체적인 메시지를 우선 표시
      let errorMessage = '로그인에 실패했습니다. 직원번호와 비밀번호를 확인해주세요.'
      
      // 타임아웃 또는 네트워크 오류 확인
      if (err.code === 'ECONNABORTED' || err.message === 'timeout of 10000ms exceeded') {
        errorMessage = '서버 응답 시간이 초과되었습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.'
      } else if (!err.response) {
        // 네트워크 오류 (서버에 연결할 수 없음)
        errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.'
      } else if (err.response?.status === 403) {
        // 403 오류: 승인 대기, 거부 등 상태별 메시지
        errorMessage = err.response?.data?.message || '접근이 거부되었습니다. 관리자에게 문의하세요.'
      } else if (err.response?.status === 401) {
        // 401 오류: 인증 실패
        const backendMessage = err.response?.data?.message || '직원번호 또는 비밀번호가 올바르지 않습니다.'
        
        // 사용자가 없을 때 회원가입 안내
        if (err.response?.data?.code === 'USER_NOT_FOUND' || backendMessage.includes('등록된 직원번호가 없습니다')) {
          errorMessage = '등록된 직원번호가 없습니다. 회원가입을 진행해주세요.'
        } else {
          errorMessage = backendMessage
        }
      } else if (err.response?.data?.message) {
        // 기타 응답 에러 메시지
        errorMessage = err.response.data.message
      } else if (err.message) {
        // 기타 오류
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const validateEmployeeNumber = (employeeNumber) => {
    if (!employeeNumber) return false
    // 6자리 영문+숫자 조합 검증
    const employeeNumberRegex = /^[A-Za-z0-9]{6}$/
    if (!employeeNumberRegex.test(employeeNumber)) return false
    // 영문과 숫자가 모두 포함되어야 함
    const hasLetter = /[A-Za-z]/.test(employeeNumber)
    const hasNumber = /[0-9]/.test(employeeNumber)
    return hasLetter && hasNumber
  }

  const handleEmployeeNumberChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setEmployeeNumber(value)
    // 6자리 입력 완료 시 비밀번호 필드로 포커스 이동
    if (value.length === 6 && validateEmployeeNumber(value)) {
      document.getElementById('password')?.focus()
    }
  }

  const handleEmployeeNumberKeyDown = (e) => {
    // Enter 키 누르면 비밀번호 필드로 이동
    if (e.key === 'Enter' && validateEmployeeNumber(employeeNumber)) {
      e.preventDefault()
      document.getElementById('password')?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">카드운영부 팀캘린더</h1>
            <p className="text-gray-600">로그인하여 일정을 관리하세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-2">
                직원번호(사번)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="employeeNumber"
                  type="text"
                  value={employeeNumber}
                  onChange={handleEmployeeNumberChange}
                  onKeyDown={handleEmployeeNumberKeyDown}
                  className="input-field pl-10 uppercase"
                  placeholder="A1B2C3"
                  maxLength={6}
                  required
                />
              </div>
              {employeeNumber && !validateEmployeeNumber(employeeNumber) && (
                <p className="mt-1 text-xs text-gray-500">6자리 영문과 숫자 조합 (예: A1B2C3)</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  로그인 상태 유지
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                비밀번호 찾기
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !validateEmployeeNumber(employeeNumber) || !password}
              className="btn-primary w-full"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 비밀번호 찾기 모달 */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmployeeNumber={employeeNumber}
      />
    </div>
  )
}

export default LoginPage
