import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Shield, Search, X, CheckCircle, XCircle, Clock, UserCog } from 'lucide-react'
import { teamsAPI } from '../api/teams'
import { authAPI } from '../api/auth'
import { getMockTeams, getMockMembers, getPendingUsers, approveUser, rejectUser } from '../utils/mockData'
import { useAuthStore } from '../store/authStore'
import TeamModal from '../components/TeamModal'
import MemberModal from '../components/MemberModal'

function AdminPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('approval') // 'approval', 'users', 'teams'
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showUserEditModal, setShowUserEditModal] = useState(false)
  const [selectedPendingUser, setSelectedPendingUser] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [editingTeam, setEditingTeam] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userStatusFilter, setUserStatusFilter] = useState('all')

  useEffect(() => {
    // Mock 데이터 로드 제거 - 실제 API 사용
    loadPendingUsers()
    loadTeams()
    if (activeTab === 'users') {
      loadAllUsers()
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam.id)
    }
  }, [selectedTeam])

  const loadPendingUsers = async () => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        const pending = getPendingUsers()
        setPendingUsers(pending)
      } else {
        const data = await authAPI.getPendingUsers()
        setPendingUsers(data || [])
      }
    } catch (error) {
      console.error('승인 대기 사용자 로드 실패:', error)
      console.error('에러 상세:', error.response?.data || error.message)
      setPendingUsers([])
      // 인증 오류가 아닌 경우에만 알림 표시
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        const errorMessage = error.response?.data?.message || error.message || '승인 대기 사용자 목록을 불러오는데 실패했습니다.'
        alert(`승인 대기 사용자 목록을 불러오는데 실패했습니다.\n\n${errorMessage}`)
      }
    }
  }

  const loadTeams = async () => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        const mockTeams = getMockTeams()
        setTeams(mockTeams)
      } else {
        const data = await teamsAPI.getTeams()
        console.log('팀 목록 로드 성공:', data)
        setTeams(data || [])
      }
    } catch (error) {
      console.error('팀 로드 실패:', error)
      console.error('에러 상세:', error.response?.data || error.message)
      setTeams([])
      // 인증 오류인 경우 로그인 페이지로 리다이렉트
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        const errorMessage = error.response?.data?.message || error.message || '팀 목록을 불러오는데 실패했습니다.'
        alert(`팀 목록을 불러오는데 실패했습니다.\n\n${errorMessage}`)
      }
    }
  }

  const loadMembers = async (teamId) => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        const mockMembers = getMockMembers()
        setMembers(mockMembers)
      } else {
        const data = await teamsAPI.getTeamMembers(teamId)
        console.log('구성원 목록 로드 성공:', data)
        setMembers(data || [])
      }
    } catch (error) {
      console.error('구성원 로드 실패:', error)
      console.error('에러 상세:', error.response?.data || error.message)
      setMembers([])
      // 인증 오류인 경우 로그인 페이지로 리다이렉트
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        const errorMessage = error.response?.data?.message || error.message || '구성원 목록을 불러오는데 실패했습니다.'
        alert(`구성원 목록을 불러오는데 실패했습니다.\n\n${errorMessage}`)
      }
    }
  }

  const handleApproveUser = async (userId) => {
    if (!window.confirm('이 사용자의 회원가입을 승인하시겠습니까?')) {
      return
    }

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        approveUser(userId, user?.id)
      } else {
        await authAPI.approveUser(userId)
      }
      
      loadPendingUsers()
      alert('회원가입이 승인되었습니다.')
    } catch (error) {
      console.error('승인 실패:', error)
      alert('승인 처리에 실패했습니다.')
    }
  }

  const handleRejectUser = (userId) => {
    setSelectedPendingUser(userId)
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!selectedPendingUser) return

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        rejectUser(selectedPendingUser, rejectionReason, user?.id)
      } else {
        await authAPI.rejectUser(selectedPendingUser, rejectionReason)
      }
      
      loadPendingUsers()
      setShowRejectModal(false)
      setSelectedPendingUser(null)
      setRejectionReason('')
      alert('회원가입이 거부되었습니다.')
    } catch (error) {
      console.error('거부 실패:', error)
      alert('거부 처리에 실패했습니다.')
    }
  }

  const handleCreateTeam = () => {
    setEditingTeam(null)
    setShowTeamModal(true)
  }

  const handleEditTeam = (team) => {
    setEditingTeam(team)
    setShowTeamModal(true)
  }

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('이 팀을 삭제하시겠습니까? 팀에 구성원이 있으면 삭제할 수 없습니다.')) {
      return
    }

    try {
      await teamsAPI.deleteTeam(teamId)
      loadTeams()
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null)
      }
    } catch (error) {
      console.error('팀 삭제 실패:', error)
      alert('팀 삭제에 실패했습니다.')
    }
  }

  const handleCreateMember = () => {
    setEditingMember(null)
    setShowMemberModal(true)
  }

  const handleEditMember = (member) => {
    setEditingMember(member)
    setShowMemberModal(true)
  }

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('이 구성원을 팀에서 제거하시겠습니까?')) {
      return
    }

    try {
      await teamsAPI.deleteTeamMember(selectedTeam.id, memberId)
      loadMembers(selectedTeam.id)
    } catch (error) {
      console.error('구성원 삭제 실패:', error)
      alert('구성원 삭제에 실패했습니다.')
    }
  }

  const handleUpdateMemberRole = async (memberId, newRole) => {
    // newRole을 대문자로 변환 (백엔드는 'ADMIN', 'MEMBER'를 기대)
    const roleUpper = newRole.toUpperCase()
    const roleText = roleUpper === 'ADMIN' ? '관리자' : '일반 구성원'
    
    if (!window.confirm(`이 구성원의 권한을 ${roleText}로 변경하시겠습니까?`)) {
      return
    }

    try {
      await teamsAPI.updateMemberRole(selectedTeam.id, memberId, roleUpper)
      loadMembers(selectedTeam.id)
    } catch (error) {
      console.error('권한 변경 실패:', error)
      console.error('에러 상세:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.message || error.message || '권한 변경에 실패했습니다.'
      alert(`권한 변경에 실패했습니다.\n\n${errorMessage}`)
    }
  }

  const loadAllUsers = async () => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (USE_MOCK) {
        // Mock 데이터는 전체 사용자 목록이 없으므로 빈 배열 반환
        setAllUsers([])
      } else {
        const params = {}
        // 백엔드는 대문자('PENDING', 'APPROVED', 'REJECTED')를 기대하므로 변환
        if (userStatusFilter !== 'all') params.status = userStatusFilter.toUpperCase()
        // 백엔드는 대문자('ADMIN', 'MEMBER')를 기대하므로 변환
        if (userRoleFilter !== 'all') params.role = userRoleFilter.toUpperCase()
        if (userSearchTerm) params.search = userSearchTerm
        
        const data = await authAPI.getAllUsers(params)
        console.log('회원 목록 로드 성공:', data)
        setAllUsers(data || [])
      }
    } catch (error) {
      console.error('회원 목록 로드 실패:', error)
      console.error('에러 상세:', error.response?.data || error.message)
      setAllUsers([])
      // 인증 오류인 경우 로그인 페이지로 리다이렉트
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
      } else {
        const errorMessage = error.response?.data?.message || error.message || '회원 목록을 불러오는데 실패했습니다.'
        alert(`회원 목록을 불러오는데 실패했습니다.\n\n${errorMessage}`)
      }
    }
  }

  const handleUpdateUser = async (userId, userData) => {
    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (!USE_MOCK) {
        await authAPI.updateUser(userId, userData)
        loadAllUsers()
        setShowUserEditModal(false)
        setSelectedUser(null)
        alert('회원 정보가 수정되었습니다.')
      }
    } catch (error) {
      console.error('회원 정보 수정 실패:', error)
      alert(error.response?.data?.message || '회원 정보 수정에 실패했습니다.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      const USE_MOCK = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_USE_MOCK === 'true'
      
      if (!USE_MOCK) {
        await authAPI.deleteUser(userId)
        loadAllUsers()
        alert('회원이 삭제되었습니다.')
      }
    } catch (error) {
      console.error('회원 삭제 실패:', error)
      alert(error.response?.data?.message || '회원 삭제에 실패했습니다.')
    }
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowUserEditModal(true)
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.employeeNumber && member.employeeNumber.toUpperCase().includes(searchTerm.toUpperCase()))
    // role 비교를 대소문자 구분 없이 처리
    const matchesRole = roleFilter === 'all' || 
      (member.role && member.role.toUpperCase() === roleFilter.toUpperCase())
    return matchesSearch && matchesRole
  })

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         (user.employeeNumber && user.employeeNumber.toUpperCase().includes(userSearchTerm.toUpperCase()))
    // role, status 비교를 대소문자 구분 없이 처리
    const matchesRole = userRoleFilter === 'all' || 
      (user.role && user.role.toUpperCase() === userRoleFilter.toUpperCase())
    const matchesStatus = userStatusFilter === 'all' || 
      (user.status && user.status.toUpperCase() === userStatusFilter.toUpperCase())
    return matchesSearch && matchesRole && matchesStatus
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자</h1>
        <p className="text-sm text-gray-600 mt-1">회원가입 승인 및 팀 관리를 하세요</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('approval')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approval'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              회원가입 승인
              {pendingUsers.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingUsers.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <UserCog className="w-4 h-4 mr-2" />
              회원 관리
            </div>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              팀 관리
            </div>
          </button>
        </nav>
      </div>

      {/* 회원가입 승인 탭 */}
      {activeTab === 'approval' && (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">회원가입 승인 대기</h2>
            <p className="text-sm text-gray-600 mt-1">
              승인 대기 중인 사용자 {pendingUsers.length}명
            </p>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">승인 대기 중인 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      이름
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      직원번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      가입 신청일
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingUsers.map((pendingUser) => (
                    <tr key={pendingUser.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{pendingUser.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {pendingUser.employeeNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(pendingUser.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveUser(pendingUser.id)}
                            className="btn-primary flex items-center text-sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            승인
                          </button>
                          <button
                            onClick={() => handleRejectUser(pendingUser.id)}
                            className="btn-secondary flex items-center text-sm bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            거부
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 회원 관리 탭 */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">회원 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              전체 회원 {allUsers.length}명
            </p>
          </div>

          {/* 검색 및 필터 */}
          <div className="mb-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => {
                  setUserSearchTerm(e.target.value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    loadAllUsers()
                  }
                }}
                className="input-field pl-10"
                placeholder="이름 또는 직원번호로 검색..."
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600 self-center mr-2">권한:</span>
              <button
                onClick={() => {
                  setUserRoleFilter('all')
                  loadAllUsers()
                }}
                className={`px-3 py-1 rounded-md text-sm ${
                  userRoleFilter === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  setUserRoleFilter('admin')
                  loadAllUsers()
                }}
                className={`px-3 py-1 rounded-md text-sm ${
                  userRoleFilter === 'admin'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                관리자
              </button>
              <button
                onClick={() => {
                  setUserRoleFilter('member')
                  loadAllUsers()
                }}
                className={`px-3 py-1 rounded-md text-sm ${
                  userRoleFilter === 'member'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                일반
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600 self-center mr-2">상태:</span>
              <button
                onClick={() => {
                  setUserStatusFilter('all')
                  loadAllUsers()
                }}
                className={`px-3 py-1 rounded-md text-sm ${
                  userStatusFilter === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => {
                  setUserStatusFilter('approved')
                  loadAllUsers()
                }}
                className={`px-3 py-1 rounded-md text-sm ${
                  userStatusFilter === 'approved'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                승인됨
              </button>
              <button
                onClick={() => {
                  setUserStatusFilter('pending')
                  loadAllUsers()
                }}
                className={`px-3 py-1 rounded-md text-sm ${
                  userStatusFilter === 'pending'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                대기중
              </button>
              <button
                onClick={() => {
                  setUserStatusFilter('rejected')
                  loadAllUsers()
                }}
                className={`px-3 py-1 rounded-md text-sm ${
                  userStatusFilter === 'rejected'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                거부됨
              </button>
            </div>
          </div>

          {/* 회원 목록 테이블 */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">회원이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      이름
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      직원번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      권한
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      가입일
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {user.employeeNumber}
                      </td>
                      <td className="px-4 py-3">
                        {user.role && user.role.toUpperCase() === 'ADMIN' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            <Shield className="w-3 h-3 mr-1" />
                            관리자
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            일반
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.status && user.status.toUpperCase() === 'APPROVED' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            승인됨
                          </span>
                        ) : user.status && user.status.toUpperCase() === 'PENDING' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            대기중
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            거부됨
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-gray-400 hover:text-primary-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 팀 관리 탭 */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 팀 목록 */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">팀 목록</h2>
                <button
                  onClick={handleCreateTeam}
                  className="btn-primary flex items-center text-sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </button>
              </div>

              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{team.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          구성원 {team.memberCount}명
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditTeam(team)
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTeam(team.id)
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 구성원 목록 */}
          <div className="lg:col-span-2">
            {selectedTeam ? (
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedTeam.name} 구성원
                    </h2>
                  </div>
                  <button
                    onClick={handleCreateMember}
                    className="btn-primary flex items-center text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    구성원 추가
                  </button>
                </div>

                {/* 검색 및 필터 */}
                <div className="mb-4 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10"
                      placeholder="이름 또는 직원번호로 검색..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRoleFilter('all')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        roleFilter === 'all'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setRoleFilter('admin')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        roleFilter === 'admin'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      관리자
                    </button>
                    <button
                      onClick={() => setRoleFilter('member')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        roleFilter === 'member'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      일반
                    </button>
                  </div>
                </div>

                {/* 구성원 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          이름
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          직원번호
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          직책
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          권한
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{member.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.employeeNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.position || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {member.role && member.role.toUpperCase() === 'ADMIN' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  <Shield className="w-3 h-3 mr-1" />
                                  관리자
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  일반
                                </span>
                              )}
                              <button
                                onClick={() =>
                                  handleUpdateMemberRole(
                                    member.id,
                                    member.role && member.role.toUpperCase() === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                                  )
                                }
                                className="text-xs text-primary-600 hover:text-primary-700"
                              >
                                변경
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditMember(member)}
                                className="text-gray-400 hover:text-primary-600"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      구성원이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card flex items-center justify-center h-64">
                <p className="text-gray-500">팀을 선택하여 구성원을 관리하세요.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 거부 사유 모달 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">회원가입 거부</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedPendingUser(null)
                  setRejectionReason('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  거부 사유 (선택)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="거부 사유를 입력하세요 (선택사항)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false)
                    setSelectedPendingUser(null)
                    setRejectionReason('')
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={confirmReject}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                >
                  거부
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 팀 모달 */}
      {showTeamModal && (
        <TeamModal
          team={editingTeam}
          onClose={() => {
            setShowTeamModal(false)
            setEditingTeam(null)
          }}
          onSave={() => {
            loadTeams()
            setShowTeamModal(false)
            setEditingTeam(null)
          }}
        />
      )}

      {/* 구성원 모달 */}
      {showMemberModal && selectedTeam && (
        <MemberModal
          teamId={selectedTeam.id}
          member={editingMember}
          onClose={() => {
            setShowMemberModal(false)
            setEditingMember(null)
          }}
          onSave={() => {
            loadMembers(selectedTeam.id)
            setShowMemberModal(false)
            setEditingMember(null)
          }}
        />
      )}

      {/* 회원 수정 모달 */}
      {showUserEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">회원 정보 수정</h2>
              <button
                onClick={() => {
                  setShowUserEditModal(false)
                  setSelectedUser(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                handleUpdateUser(selectedUser.id, {
                  name: formData.get('name'),
                  role: formData.get('role'),
                  status: formData.get('status'),
                })
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedUser.name}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  직원번호
                </label>
                <input
                  type="text"
                  value={selectedUser.employeeNumber}
                  className="input-field bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  권한
                </label>
                <select name="role" defaultValue={selectedUser.role} className="input-field">
                  <option value="MEMBER">일반</option>
                  <option value="ADMIN">관리자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <select name="status" defaultValue={selectedUser.status} className="input-field">
                  <option value="PENDING">대기중</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="REJECTED">거부됨</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserEditModal(false)
                    setSelectedUser(null)
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
