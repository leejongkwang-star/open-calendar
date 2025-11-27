import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../api/auth'
import { mockLogin, loadMockData } from '../utils/mockData'
import { Hash, Lock, AlertCircle } from 'lucide-react'

function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    // 더미 데이터 초기화
    loadMockData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 백엔드가 없을 경우 모크 로그인 사용
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      let response
      if (USE_MOCK) {
        response = await mockLogin(employeeNumber, password)
      } else {
        response = await authAPI.login(employeeNumber, password)
      }
      
      login(response.user, response.token)
      navigate('/calendar')
    } catch (err) {
      setError(err.message || err.response?.data?.message || '로그인에 실패했습니다. 직원번호와 비밀번호를 확인해주세요.')
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">팀 캘린더</h1>
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
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                비밀번호 찾기
              </a>
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
    </div>
  )
}

export default LoginPage
