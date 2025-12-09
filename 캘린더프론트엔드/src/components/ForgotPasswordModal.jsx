import { useState } from 'react'
import { X, Hash, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { authAPI } from '../api/auth'

function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1) // 1: 직원번호 확인, 2: 비밀번호 재설정
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  if (!isOpen) return null

  const handleEmployeeNumberChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setEmployeeNumber(value)
    setError('')
    setSuccess(false)
    setUserInfo(null)
  }

  const validateEmployeeNumber = (employeeNumber) => {
    if (!employeeNumber) return false
    const employeeNumberRegex = /^[A-Za-z0-9]{6}$/
    if (!employeeNumberRegex.test(employeeNumber)) return false
    const hasLetter = /[A-Za-z]/.test(employeeNumber)
    const hasNumber = /[0-9]/.test(employeeNumber)
    return hasLetter && hasNumber
  }

  const validatePassword = (password) => {
    if (!password) return '비밀번호를 입력해주세요.'
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
    return ''
  }

  const handleCheckEmployeeNumber = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setUserInfo(null)

    if (!validateEmployeeNumber(employeeNumber)) {
      setError('올바른 직원번호를 입력해주세요. (6자리 영문과 숫자 조합)')
      return
    }

    setLoading(true)

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        // Mock 모드: 로컬 스토리지에서 확인
        const users = JSON.parse(localStorage.getItem('mock-users') || '[]')
        const user = users.find((u) => u.employeeNumber.toUpperCase() === employeeNumber.toUpperCase())
        
        if (user) {
          setUserInfo({
            employeeNumber: user.employeeNumber,
            name: user.name,
          })
          setStep(2) // 비밀번호 재설정 단계로 이동
        } else {
          setError('해당 직원번호로 등록된 사용자를 찾을 수 없습니다.')
        }
      } else {
        // 실제 API 호출 - 직원번호 확인
        const response = await authAPI.checkEmployeeNumber(employeeNumber)
        
        if (response.exists) {
          setUserInfo({
            employeeNumber: employeeNumber.toUpperCase(),
          })
          setStep(2) // 비밀번호 재설정 단계로 이동
        } else {
          setError('해당 직원번호로 등록된 사용자를 찾을 수 없습니다.')
        }
      }
    } catch (err) {
      console.error('직원번호 확인 실패:', err)
      setError(err.response?.data?.message || '직원번호 확인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // 비밀번호 검증
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        // Mock 모드: 로컬 스토리지 업데이트
        const users = JSON.parse(localStorage.getItem('mock-users') || '[]')
        const updatedUsers = users.map((u) =>
          u.employeeNumber.toUpperCase() === employeeNumber.toUpperCase()
            ? { ...u, password: newPassword }
            : u
        )
        localStorage.setItem('mock-users', JSON.stringify(updatedUsers))
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        // 실제 API 호출 - 비밀번호 재설정
        await authAPI.resetPassword(employeeNumber, newPassword)
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    } catch (err) {
      console.error('비밀번호 재설정 실패:', err)
      setError(err.response?.data?.message || '비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setEmployeeNumber('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
    setUserInfo(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">비밀번호 찾기</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={step === 1 ? handleCheckEmployeeNumber : handleResetPassword} className="p-6 space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  직원번호(사번) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={employeeNumber}
                    onChange={handleEmployeeNumberChange}
                    className="input-field pl-10 uppercase"
                    placeholder="A1B2C3"
                    maxLength={6}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {employeeNumber && !validateEmployeeNumber(employeeNumber) && (
                  <p className="mt-1 text-xs text-gray-500">6자리 영문과 숫자 조합 (예: A1B2C3)</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading || !validateEmployeeNumber(employeeNumber)}
                  className="btn-primary"
                >
                  {loading ? '확인 중...' : '다음'}
                </button>
              </div>
            </>
          ) : (
            <>
              {userInfo && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700 space-y-1">
                    {userInfo.name && (
                      <p>
                        <span className="font-medium">이름:</span> {userInfo.name}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">직원번호:</span> {userInfo.employeeNumber}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setError('')
                    }}
                    className="input-field pl-10"
                    placeholder="8자 이상 입력하세요"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {newPassword && newPassword.length < 8 && (
                  <p className="mt-1 text-xs text-gray-500">비밀번호는 8자 이상이어야 합니다.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setError('')
                    }}
                    className="input-field pl-10"
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    disabled={loading}
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                  <p className="mt-1 text-xs text-green-500">비밀번호가 일치합니다.</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">비밀번호가 성공적으로 재설정되었습니다. 잠시 후 창이 닫힙니다.</span>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setNewPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  className="btn-secondary"
                  disabled={loading || success}
                >
                  이전
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8 || success}
                    className="btn-primary"
                  >
                    {loading ? '재설정 중...' : '비밀번호 재설정'}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordModal

