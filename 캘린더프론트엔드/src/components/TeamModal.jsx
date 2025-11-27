import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { teamsAPI } from '../api/teams'

function TeamModal({ team, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
      })
    }
  }, [team])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (team?.id) {
        await teamsAPI.updateTeam(team.id, formData)
      } else {
        await teamsAPI.createTeam(formData)
      }
      onSave()
    } catch (error) {
      console.error('팀 저장 실패:', error)
      alert('팀 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {team ? '팀 수정' : '새 팀'}
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
              팀 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="팀 이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="팀에 대한 설명을 입력하세요"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              취소
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '저장 중...' : team ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeamModal

