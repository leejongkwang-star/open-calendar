import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Dice6, Users, X } from 'lucide-react'
import { teamsAPI } from '../api/teams'
import { authAPI } from '../api/auth'
import { useAuthStore } from '../store/authStore'

function LunchLotteryPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [teams, setTeams] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [candidates, setCandidates] = useState([]) // 뽑기 대상자
  const [excludeUserIds, setExcludeUserIds] = useState([]) // 제외할 인원
  const [drawCount, setDrawCount] = useState(1) // 뽑을 인원 수
  const [isDrawing, setIsDrawing] = useState(false) // 뽑기 진행 중
  const [result, setResult] = useState(null) // 뽑기 결과
  const [animationNames, setAnimationNames] = useState([]) // 애니메이션용 이름 목록
  const resultRef = useRef(null) // 결과 영역 참조

  // 팀 목록 로드
  useEffect(() => {
    loadTeams()
    if (user?.role === 'ADMIN') {
      loadAllUsers()
    }
  }, [user])

  // 팀 선택 시 해당 팀의 구성원 로드
  useEffect(() => {
    if (selectedTeamId) {
      loadTeamMembers(selectedTeamId)
    } else {
      // 전체 직원 모드
      if (user?.role === 'ADMIN' && allUsers.length > 0) {
        const approvedUsers = allUsers.filter(u => u.status === 'APPROVED')
        setCandidates(approvedUsers.map(u => ({
          id: u.id,
          name: u.name,
          employeeNumber: u.employeeNumber
        })))
      }
    }
  }, [selectedTeamId, allUsers, user])

  // 결과가 나오면 자동으로 스크롤
  useEffect(() => {
    if (result && result.length > 0 && !isDrawing) {
      // 애니메이션 완료 후 스크롤
      const scrollTimer = setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
        }
      }, 500) // 애니메이션 완료 대기
      
      return () => clearTimeout(scrollTimer)
    }
  }, [result, isDrawing])

  const loadTeams = async () => {
    try {
      const data = await teamsAPI.getTeams()
      setTeams(data || [])
    } catch (error) {
      console.error('팀 목록 로드 실패:', error)
      setTeams([])
    }
  }

  const loadAllUsers = async () => {
    try {
      const data = await authAPI.getAllUsers({ status: 'APPROVED' })
      setAllUsers(data || [])
    } catch (error) {
      console.error('전체 사용자 로드 실패:', error)
      setAllUsers([])
    }
  }

  const loadTeamMembers = async (teamId) => {
    try {
      const data = await teamsAPI.getTeamMembers(teamId)
      setTeamMembers(data || [])
      setCandidates(data.map(m => ({
        id: m.userId,
        name: m.name,
        employeeNumber: m.employeeNumber
      })))
    } catch (error) {
      console.error('팀 구성원 로드 실패:', error)
      setTeamMembers([])
      setCandidates([])
    }
  }

  // 제외 인원 토글
  const toggleExclude = (userId) => {
    setExcludeUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // 뽑기 실행 (버튼 스타일 수정 전, 잘 동작하던 단순 버전으로 롤백)
  const handleDraw = () => {
    if (candidates.length === 0) {
      alert('뽑을 대상자가 없습니다.')
      return
    }

    // 제외 인원 필터링
    const availableCandidates = candidates.filter(c => !excludeUserIds.includes(c.id))
    
    if (availableCandidates.length === 0) {
      alert('제외할 인원이 너무 많습니다. 뽑을 대상자가 없습니다.')
      return
    }

    // drawCount가 빈 문자열이거나 유효하지 않으면 1로 설정
    const finalDrawCount = (typeof drawCount === 'number' && drawCount > 0) ? drawCount : 1
    
    if (finalDrawCount > availableCandidates.length) {
      alert(`뽑을 인원 수(${finalDrawCount})가 대상자 수(${availableCandidates.length})보다 많습니다.`)
      return
    }
    
    // drawCount가 빈 문자열이었으면 1로 업데이트
    if (drawCount === '' || drawCount < 1) {
      setDrawCount(1)
    }

    setIsDrawing(true)
    setResult(null)

    // 애니메이션용 이름 목록 생성 (슬롯머신 효과)
    const animationInterval = setInterval(() => {
      const randomNames = []
      for (let i = 0; i < finalDrawCount; i++) {
        const randomIndex = Math.floor(Math.random() * availableCandidates.length)
        randomNames.push(availableCandidates[randomIndex].name)
      }
      setAnimationNames([...randomNames])
    }, 100) // 100ms마다 이름 변경

    // 2초 후 결과 표시
    setTimeout(() => {
      console.log('=== 타이머 실행됨 - 결과 생성 시작 ===')
      console.log('현재 isDrawing 상태:', isDrawing)
      console.log('availableCandidates:', availableCandidates.length)
      console.log('finalDrawCount:', finalDrawCount)
      
      clearInterval(animationInterval)
      
      // 실제 뽑기 실행 - Fisher-Yates 셔플 알고리즘 사용 (정확한 균등 분포)
      const selected = []
      const shuffled = [...availableCandidates]
      
      // Fisher-Yates 셔플 알고리즘
      for (let i = shuffled.length - 1; i > 0; i--) {
        // 0부터 i까지의 랜덤 인덱스 선택
        const j = Math.floor(Math.random() * (i + 1))
        // 현재 요소와 랜덤으로 선택된 요소 교환
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      
      // 셔플된 배열에서 앞에서부터 필요한 만큼 선택
      for (let i = 0; i < finalDrawCount && i < shuffled.length; i++) {
        selected.push(shuffled[i])
      }

      console.log('뽑기 완료:', selected)
      console.log('선택된 인원 수:', selected.length)
      console.log('상태 업데이트 전 - isDrawing:', isDrawing, 'result:', result)
      
      console.log('setResult 호출 중...')
      setResult(selected)
      console.log('setIsDrawing(false) 호출 중...')
      setIsDrawing(false)
      setAnimationNames([])
      
      // 상태 업데이트 확인을 위한 추가 로그
      setTimeout(() => {
        console.log('상태 업데이트 후 확인 - isDrawing:', isDrawing, 'result:', result)
      }, 100)
      
      console.log('=== 타이머 완료 ===')
    }, 2000)
  }

  // 재뽑기
  const handleRedraw = () => {
    setResult(null)
    handleDraw()
  }

  // 초기화
  const handleReset = () => {
    setResult(null)
    setExcludeUserIds([])
    setDrawCount(1)
    setAnimationNames([])
    setIsDrawing(false)
  }

  return (
    <div className="h-full">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/calendar')}
            className="btn-secondary flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Dice6 className="w-6 h-6 text-primary-600" />
              점심당번 뽑기
            </h1>
            <p className="text-sm text-gray-600 mt-1">공정하게 점심당번을 뽑아보세요!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 옵션 설정 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">뽑기 옵션</h2>

            {/* 팀 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대상 선택
              </label>
              <select
                value={selectedTeamId || ''}
                onChange={(e) => {
                  const teamId = e.target.value ? parseInt(e.target.value) : null
                  setSelectedTeamId(teamId)
                  setExcludeUserIds([])
                  setResult(null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">전체 직원</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 뽑을 인원 수 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                뽑을 인원 수
              </label>
              <input
                type="number"
                min="1"
                max={candidates.length || 1}
                value={drawCount}
                onChange={(e) => {
                  const inputValue = e.target.value
                  
                  // 빈 문자열이면 빈 문자열로 설정 (지울 수 있게)
                  if (inputValue === '') {
                    setDrawCount('')
                    return
                  }
                  
                  const numValue = parseInt(inputValue, 10)
                  
                  // 숫자가 아니거나 NaN이면 무시
                  if (isNaN(numValue)) {
                    return
                  }
                  
                  // 1보다 작으면 무시 (사용자가 입력 중일 수 있음)
                  if (numValue < 1) {
                    return
                  }
                  
                  // 범위 제한
                  const maxCount = candidates.length > 0 ? candidates.length : 1
                  const finalValue = Math.min(numValue, maxCount)
                  setDrawCount(finalValue)
                }}
                onBlur={(e) => {
                  // 포커스를 잃을 때 빈 값이거나 1보다 작으면 1로 설정
                  const value = e.target.value
                  if (value === '' || parseInt(value, 10) < 1 || isNaN(parseInt(value, 10))) {
                    setDrawCount(1)
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {candidates.length > 0 
                  ? `최대 ${candidates.length}명까지 뽑을 수 있습니다`
                  : '대상을 먼저 선택해주세요'}
              </p>
            </div>

            {/* 제외할 인원 */}
            {candidates.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제외할 인원 (선택사항)
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {candidates.map(candidate => (
                    <label
                      key={candidate.id}
                      className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={excludeUserIds.includes(candidate.id)}
                        onChange={() => toggleExclude(candidate.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {candidate.name} ({candidate.employeeNumber})
                      </span>
                    </label>
                  ))}
                </div>
                {excludeUserIds.length > 0 && (
                  <button
                    onClick={() => setExcludeUserIds([])}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                  >
                    제외 목록 초기화
                  </button>
                )}
              </div>
            )}

            {/* 뽑기 버튼 */}
            <button
              onClick={handleDraw}
              disabled={isDrawing || candidates.length === 0}
              className="w-full btn-primary flex items-center justify-center py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDrawing ? (
                <>
                  <Dice6 className="w-5 h-5 mr-2 animate-spin" />
                  뽑는 중...
                </>
              ) : (
                <>
                  <Dice6 className="w-5 h-5 mr-2" />
                  뽑기 시작!
                </>
              )}
            </button>

            {/* 초기화 버튼 */}
            {result && (
              <button
                onClick={handleReset}
                className="w-full mt-2 btn-secondary py-2"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 오른쪽: 뽑기 결과 */}
        <div className="lg:col-span-2">
          <div 
            ref={resultRef}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 min-h-[500px] flex items-center justify-center"
          >
            {isDrawing ? (
              // 애니메이션 중
              <div className="text-center w-full">
                <Dice6 className="w-20 h-20 mx-auto mb-6 text-primary-600 animate-spin" />
                <div className="space-y-6">
                  {Array.from({ length: (typeof drawCount === 'number' && drawCount > 0) ? drawCount : 1 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-primary-100 to-primary-200 rounded-lg p-6 border-2 border-primary-300"
                    >
                      <div className="text-5xl font-bold text-primary-700 animate-pulse">
                        {animationNames[index] || '...'}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 mt-6 text-lg">뽑는 중...</p>
              </div>
            ) : !isDrawing && result && result.length > 0 ? (
              // 결과 표시 (당첨 애니메이션)
              <div className="text-center w-full" id="lottery-result">
                {/* 축하 메시지 */}
                <div className="mb-8 animate-fade-in">
                  <h3 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                    <span className="text-5xl animate-bounce">🎉</span>
                    <span className="bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent">
                      축하합니다!
                    </span>
                    <span className="text-5xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
                  </h3>
                  <p className="text-xl text-gray-600">당첨자를 발표합니다!</p>
                </div>
                
                {/* 당첨자 카드 */}
                <div className="space-y-6">
                  {result.map((person, index) => (
                    <div
                      key={person.id}
                      className="bg-gradient-to-r from-primary-500 via-primary-600 to-pink-500 text-white rounded-2xl p-10 shadow-2xl transform hover:scale-105 transition-all duration-300 animate-bounce-in relative overflow-hidden"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      {/* 배경 효과 */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                      
                      {/* 내용 */}
                      <div className="relative z-10">
                        <div className="text-7xl font-bold mb-4 animate-pulse">
                          {person.name}
                        </div>
                        <div className="text-2xl opacity-90 mb-3 font-semibold">
                          {person.employeeNumber}
                        </div>
                        {result.length > 1 && (
                          <div className="text-lg opacity-90 mt-4 bg-white bg-opacity-30 rounded-full px-6 py-2 inline-block font-semibold">
                            {index + 1}번째 당번
                          </div>
                        )}
                      </div>
                      
                      {/* 장식 효과 */}
                      <div className="absolute top-2 right-2 text-4xl opacity-30 animate-spin" style={{ animationDuration: '3s' }}>
                        ⭐
                      </div>
                      <div className="absolute bottom-2 left-2 text-4xl opacity-30 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                        ✨
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-3 justify-center">
                  <button
                    onClick={handleRedraw}
                    className="btn-primary flex items-center justify-center px-6 py-3 text-lg"
                  >
                    <Dice6 className="w-5 h-5 mr-2" />
                    다시 뽑기
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-secondary px-6 py-3 text-lg"
                  >
                    초기화
                  </button>
                </div>
              </div>
            ) : (
              // 초기 상태
              <div className="text-center text-gray-400">
                <Dice6 className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p className="text-lg">옵션을 설정하고 뽑기를 시작하세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LunchLotteryPage

