# 팀 캘린더 앱 - 프론트엔드

부서원들 간 휴가 및 기타 일정을 공유할 수 있는 웹 기반 캘린더 애플리케이션의 프론트엔드입니다.

## 기술 스택

- **React 18**: UI 라이브러리
- **Vite**: 빌드 도구
- **Tailwind CSS**: 스타일링
- **React Router**: 라우팅
- **Zustand**: 상태 관리
- **React Big Calendar**: 캘린더 컴포넌트
- **Axios**: HTTP 클라이언트
- **Lucide React**: 아이콘

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 프로젝트 구조

```
src/
├── components/       # 재사용 가능한 컴포넌트
├── pages/           # 페이지 컴포넌트
├── store/           # Zustand 상태 관리
├── utils/           # 유틸리티 함수
├── api/             # API 호출 함수
├── hooks/           # 커스텀 훅
└── styles/          # 전역 스타일
```

## 주요 기능

- 로그인 화면
- 캘린더 화면 (일정 조회, 등록, 수정, 삭제)
- 관리자 화면 (팀 관리, 구성원 관리)

