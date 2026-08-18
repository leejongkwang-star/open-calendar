import { useState, useEffect } from 'react'
import { X, Hash, Lock, AlertCircle, CheckCircle, User } from 'lucide-react'
import { authAPI } from '../api/auth'

function ForgotPasswordModal({ isOpen, onClose, initialEmployeeNumber = '' }) {
  const [step, setStep] = useState(1)
  const [employeeNumber, setEmployeeNumber] = useState(initialEmployeeNumber)
  const [name, setName] = useState('')
  const [resetStatus, setResetStatus] = useState('none')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const resetForm = (keepEmployeeNumber = false) => {
    if (!keepEmployeeNumber) setEmployeeNumber(initialEmployeeNumber || '')
    setStep(1)
    setName('')
    setResetStatus('none')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
      if (initialEmployeeNumber) setEmployeeNumber(initialEmployeeNumber)
    }
  }, [isOpen, initialEmployeeNumber])

  if (!isOpen) return null

  const validateEmployeeNumber = (value) => {
    if (!value) return false
    if (!/^[A-Za-z0-9]{6}$/.test(value)) return false
    return /[A-Za-z]/.test(value) && /[0-9]/.test(value)
  }

  const validatePassword = (password) => {
    if (!password) return '비밀번호를 입력해주세요.'
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
    return ''
  }

  const handleEmployeeNumberChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setEmployeeNumber(value)
    setError('')
    setSuccess('')
  }

  const handleCheckEmployeeNumber = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateEmployeeNumber(employeeNumber)) {
      setError('올바른 직원번호를 입력해주세요. (6자리 영문과 숫자 조합)')
      return
    }

    setLoading(true)
    try {
      const status = await authAPI.getPasswordResetStatus(employeeNumber)
      if (!status?.exists) {
        setError('해당 직원번호로 등록된 사용자를 찾을 수 없습니다.')
        return
      }
      setResetStatus(status.resetStatus || 'none')
      if (status.resetStatus === 'approved') {
        setStep('approved')
      } else {
        setStep('choose')
      }
    } catch (err) {
      if (!err.response) {
        setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else {
        setError(err.response?.data?.message || '직원번호 확인 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (name.trim().length < 2) {
      setError('이름을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const result = await authAPI.requestPasswordReset(employeeNumber, name.trim())
      setSuccess(result.message || '요청이 접수되었습니다. 관리자 승인 후 다시 진행해주세요.')
      setResetStatus('pending')
    } catch (err) {
      setError(err.response?.data?.message || '요청 접수 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      return
    }

    const needsCurrent = step === 'with-current'
    if (needsCurrent && !currentPassword) {
      setError('기존 비밀번호를 입력해주세요.')
      return
    }

    if (needsCurrent && currentPassword === newPassword) {
      setError('새 비밀번호는 기존 비밀번호와 달라야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword(
        employeeNumber,
        newPassword,
        needsCurrent ? currentPassword : null
      )
      setSuccess('비밀번호가 성공적으로 변경되었습니다. 잠시 후 창이 닫힙니다.')
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const goBackToStart = () => {
    setStep(1)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setName('')
    setError('')
    setSuccess('')
  }

  const formSubmit =
    step === 1
      ? handleCheckEmployeeNumber
      : step === 'request'
        ? handleRequestReset
        : step === 'with-current' || step === 'approved'
          ? handleResetPassword
          : (e) => e.preventDefault()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">비밀번호 변경</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={formSubmit} className="p-6 space-y-4">
          {step === 1 && (
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
            </>
          )}

          {step === 'choose' && (
            <>
              <p className="text-sm text-gray-600">
                직원번호 <span className="font-mono font-semibold">{employeeNumber}</span>
              </p>
              {resetStatus === 'pending' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  비밀번호 변경 요청이 관리자 승인 대기 중입니다. 승인되면 다시 이 화면에서 새 비밀번호를 설정할 수 있습니다.
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep('with-current')
                }}
                className="w-full btn-primary"
              >
                기존 비밀번호로 변경
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setSuccess('')
                  setStep('request')
                }}
                className="w-full btn-secondary"
                disabled={resetStatus === 'pending'}
              >
                {resetStatus === 'pending' ? '승인 대기 중' : '비밀번호를 모름 · 변경 요청'}
              </button>
            </>
          )}

          {step === 'request' && (
            <>
              <p className="text-sm text-gray-600">
                가입 시 등록한 이름을 입력하면 관리자에게 변경 요청이 전달됩니다.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError('')
                    }}
                    className="input-field pl-10"
                    placeholder="홍길동"
                    required
                    disabled={loading || !!success}
                    autoFocus
                  />
                </div>
              </div>
            </>
          )}

          {(step === 'with-current' || step === 'approved') && (
            <>
              {step === 'approved' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  관리자가 변경을 승인했습니다. 24시간 안에 새 비밀번호를 설정하세요.
                </div>
              )}
              {step === 'with-current' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기존 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        setError('')
                      }}
                      className="input-field pl-10"
                      placeholder="현재 사용 중인 비밀번호"
                      required
                      disabled={loading}
                      autoFocus
                    />
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
                    autoFocus={step === 'approved'}
                  />
                </div>
                {newPassword && newPassword.length < 8 && (
                  <p className="mt-1 text-xs text-gray-500">비밀번호는 8자 이상이어야 합니다.</p>
                )}
                {step === 'with-current' && currentPassword && newPassword && currentPassword === newPassword && (
                  <p className="mt-1 text-xs text-red-500">새 비밀번호는 기존 비밀번호와 달라야 합니다.</p>
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
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            {step === 1 ? (
              <>
                <span />
                <div className="flex gap-2">
                  <button type="button" onClick={handleClose} className="btn-secondary" disabled={loading}>
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
                <button
                  type="button"
                  onClick={goBackToStart}
                  className="btn-secondary"
                  disabled={loading}
                >
                  이전
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={handleClose} className="btn-secondary" disabled={loading}>
                    취소
                  </button>
                  {step === 'request' && (
                    <button
                      type="submit"
                      disabled={loading || name.trim().length < 2 || !!success}
                      className="btn-primary"
                    >
                      {loading ? '요청 중...' : '변경 요청'}
                    </button>
                  )}
                  {(step === 'with-current' || step === 'approved') && (
                    <button
                      type="submit"
                      disabled={
                        loading
                        || !!success
                        || !newPassword
                        || !confirmPassword
                        || newPassword !== confirmPassword
                        || newPassword.length < 8
                        || (step === 'with-current' && (!currentPassword || currentPassword === newPassword))
                      }
                      className="btn-primary"
                    >
                      {loading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPasswordModal
