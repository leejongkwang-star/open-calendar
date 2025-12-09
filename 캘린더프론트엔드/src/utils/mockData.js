// 백엔드 없이 테스트하기 위한 더미 데이터 및 모크 함수

// 더미 사용자 데이터
export const mockUsers = [
  {
    id: 1,
    employeeNumber: 'ADM001',
    name: '관리자',
    role: 'admin',
    status: 'approved',
  },
  {
    id: 2,
    employeeNumber: 'USR001',
    name: '일반 사용자',
    role: 'member',
    status: 'approved',
  },
]

// 더미 팀 데이터
export const mockTeams = [
  {
    id: 1,
    name: '개발팀',
    description: '개발 관련 업무',
    memberCount: 5,
  },
  {
    id: 2,
    name: '디자인팀',
    description: '디자인 관련 업무',
    memberCount: 3,
  },
]

// 더미 구성원 데이터
export const mockMembers = [
  {
    id: 1,
    name: '홍길동',
    employeeNumber: 'ADM001',
    position: '팀장',
    role: 'admin',
    userId: 1,
  },
  {
    id: 2,
    name: '김철수',
    employeeNumber: 'USR001',
    position: '개발자',
    role: 'member',
    userId: 2,
  },
  {
    id: 3,
    name: '이영희',
    employeeNumber: 'USR002',
    position: '디자이너',
    role: 'member',
    userId: 3,
  },
]

// 더미 일정 데이터
export const mockEvents = [
  {
    id: 1,
    title: '연차',
    start: new Date(2024, 11, 15),
    end: new Date(2024, 11, 16),
    eventType: 'VACATION',
    userId: 1,
    userName: '홍길동',
    description: '연차 사용',
  },
  {
    id: 2,
    title: '팀 회의',
    start: new Date(2024, 11, 20, 14, 0),
    end: new Date(2024, 11, 20, 16, 0),
    eventType: 'MEETING',
    userId: 2,
    userName: '김철수',
    description: '주간 팀 회의',
  },
  {
    id: 3,
    title: '프로젝트 발표',
    start: new Date(2024, 11, 25, 10, 0),
    end: new Date(2024, 11, 25, 12, 0),
    eventType: 'OTHER',
    userId: 3,
    userName: '이영희',
    description: '프로젝트 발표 준비',
  },
]

// 로컬 스토리지에서 데이터 로드
export const loadMockData = () => {
  if (typeof window === 'undefined') return

  // 초기 데이터 설정
  if (!localStorage.getItem('mock-teams')) {
    localStorage.setItem('mock-teams', JSON.stringify(mockTeams))
  }
  if (!localStorage.getItem('mock-members')) {
    localStorage.setItem('mock-members', JSON.stringify(mockMembers))
  }
  if (!localStorage.getItem('mock-events')) {
    localStorage.setItem('mock-events', JSON.stringify(mockEvents))
  }
}

// 로컬 스토리지에서 사용자 가져오기
export const getMockUsers = () => {
  if (typeof window === 'undefined') return mockUsers
  const stored = localStorage.getItem('mock-users')
  if (stored) {
    return JSON.parse(stored)
  }
  // 초기 사용자 설정
  localStorage.setItem('mock-users', JSON.stringify(mockUsers))
  return mockUsers
}

// 모크 회원가입 함수
export const mockSignup = (name, employeeNumber, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getMockUsers()
      
      // 직원번호 중복 확인
      if (users.some((u) => u.employeeNumber === employeeNumber.toUpperCase())) {
        reject(new Error('이미 사용 중인 직원번호입니다.'))
        return
      }

      // 새 사용자 생성 (승인 대기 상태)
      const newUser = {
        id: Date.now(),
        employeeNumber: employeeNumber.toUpperCase(),
        name,
        role: 'member', // 기본 역할은 일반 사용자
        status: 'pending', // 관리자 승인 대기
        createdAt: new Date().toISOString(),
      }

      // 사용자 저장 (실제로는 비밀번호도 저장하지만, 여기서는 생략)
      users.push(newUser)
      localStorage.setItem('mock-users', JSON.stringify(users))

      resolve({
        user: newUser,
        message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.',
      })
    }, 500) // 로딩 시뮬레이션
  })
}

// 모크 로그인 함수
export const mockLogin = (employeeNumber, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getMockUsers()
      const user = users.find((u) => u.employeeNumber === employeeNumber.toUpperCase())
      if (user) {
        // 승인 상태 확인 (대소문자 구분 없이 처리)
        const userStatus = user.status ? user.status.toUpperCase() : ''
        if (userStatus === 'PENDING') {
          reject(new Error('관리자 승인 대기 중입니다. 승인 후 로그인할 수 있습니다.'))
          return
        }
        if (userStatus === 'REJECTED') {
          reject(new Error('회원가입이 거부되었습니다. 관리자에게 문의하세요.'))
          return
        }
        if (userStatus !== 'APPROVED') {
          reject(new Error('로그인할 수 없는 상태입니다. 관리자에게 문의하세요.'))
          return
        }
        
        resolve({
          user,
          token: 'mock-token-' + Date.now(),
        })
      } else {
        reject(new Error('직원번호 또는 비밀번호가 올바르지 않습니다.'))
      }
    }, 500) // 로딩 시뮬레이션
  })
}

// 승인 대기 사용자 목록 가져오기
export const getPendingUsers = () => {
  const users = getMockUsers()
  // 대소문자 구분 없이 처리
  return users.filter((u) => u.status && u.status.toUpperCase() === 'PENDING')
}

// 사용자 승인
export const approveUser = (userId, approvedBy) => {
  const users = getMockUsers()
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex !== -1) {
    users[userIndex] = {
      ...users[userIndex],
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy,
    }
    localStorage.setItem('mock-users', JSON.stringify(users))
    return users[userIndex]
  }
  return null
}

// 사용자 거부
export const rejectUser = (userId, rejectionReason, rejectedBy) => {
  const users = getMockUsers()
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex !== -1) {
    users[userIndex] = {
      ...users[userIndex],
      status: 'rejected',
      rejectionReason,
      rejectedAt: new Date().toISOString(),
      rejectedBy,
    }
    localStorage.setItem('mock-users', JSON.stringify(users))
    return users[userIndex]
  }
  return null
}

// 로컬 스토리지에서 이벤트 가져오기
export const getMockEvents = () => {
  const events = localStorage.getItem('mock-events')
  if (events) {
    const parsed = JSON.parse(events)
    return parsed.map((event) => {
      const start = new Date(event.start)
      const end = new Date(event.end)
      
      // react-big-calendar는 end 날짜를 exclusive로 처리하므로,
      // 종료일까지 표시하려면 end를 종료일 다음 날 자정으로 설정해야 함
      // 원본 endDate 저장 (수정 모달에서 사용하기 위해)
      const originalEndDate = new Date(end)
      
      const endDate = new Date(end)
      endDate.setDate(endDate.getDate() + 1) // 다음 날로 설정
      endDate.setHours(0, 0, 0, 0) // 자정으로 설정
      
      return {
        ...event,
        start: start,
        end: endDate, // 종료일 다음 날 자정 (캘린더 표시용)
        originalEndDate: originalEndDate, // 원본 종료일 (수정 모달용)
      }
    })
  }
  return []
}

// 로컬 스토리지에 이벤트 저장
export const saveMockEvent = (event) => {
  const events = getMockEvents()
  if (event.id) {
    // 수정
    const index = events.findIndex((e) => e.id === event.id)
    if (index !== -1) {
      events[index] = { ...events[index], ...event }
    }
  } else {
    // 생성
    const newEvent = {
      ...event,
      id: Date.now(),
      userId: 1, // 임시로 현재 사용자 ID
      userName: '현재 사용자',
    }
    events.push(newEvent)
  }
  localStorage.setItem('mock-events', JSON.stringify(events))
  return event.id ? events.find((e) => e.id === event.id) : events[events.length - 1]
}

// 로컬 스토리지에서 이벤트 삭제
export const deleteMockEvent = (eventId) => {
  const events = getMockEvents()
  const filtered = events.filter((e) => e.id !== eventId)
  localStorage.setItem('mock-events', JSON.stringify(filtered))
}

// 로컬 스토리지에서 팀 가져오기
export const getMockTeams = () => {
  const teams = localStorage.getItem('mock-teams')
  return teams ? JSON.parse(teams) : []
}

// 로컬 스토리지에서 구성원 가져오기
export const getMockMembers = () => {
  const members = localStorage.getItem('mock-members')
  return members ? JSON.parse(members) : []
}

