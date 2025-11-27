import { useState, useEffect } from 'react'
import { X, Hash } from 'lucide-react'
import { teamsAPI } from '../api/teams'

function MemberModal({ teamId, member, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    position: '',
    phone: '',
    role: 'member',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        employeeNumber: member.employeeNumber || '',
        position: member.position || '',
        phone: member.phone || '',
        role: member.role || 'member',
      })
    }
  }, [member])

  const handleEmployeeNumberChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setFormData({ ...formData, employeeNumber: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (member?.id) {
        await teamsAPI.updateTeamMember(teamId, member.id, formData)
      } else {
        await teamsAPI.addTeamMember(teamId, formData)
      }
      onSave()
    } catch (error) {
      console.error('구성원 저장 실패:', error)
      alert('구성원 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {member ? '구성원 수정' : '새 구성원'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              직원번호(사번) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={formData.employeeNumber}
                onChange={handleEmployeeNumberChange}
                className="input-field pl-10 uppercase"
                placeholder="A1B2C3"
                maxLength={6}
                required
                disabled={!!member}
              />
            </div>
            {member && (
              <p className="text-xs text-gray-500 mt-1">직원번호는 수정할 수 없습니다.</p>
            )}
            {!member && formData.employeeNumber && (
              <p className="text-xs text-gray-500 mt-1">6자리 영문과 숫자 조합 (예: A1B2C3)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              직책
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="input-field"
              placeholder="직책을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              권한 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
              required
            >
              <option value="member">일반 구성원</option>
              <option value="admin">관리자</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '저장 중...' : member ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MemberModal
