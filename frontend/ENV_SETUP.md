# 프론트엔드 환경 변수 설정

## 환경 변수 목록

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_API_BASE_URL` | 예 | 백엔드 API 기본 URL. **반드시 `/api` 까지 포함**해야 합니다. |
| `VITE_DEPT_NAME` | 아니오 | 부서명. 로그인 화면 제목, 헤더, PWA 앱 이름에 사용됩니다. 미설정 시 `카드운영부`. |

## 로컬 개발용 .env 예시

프론트엔드 루트 디렉토리에 `.env` 파일을 만들고 다음 내용을 넣습니다.

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_DEPT_NAME=카드운영부
```

수정 후에는 개발 서버를 재시작해야 반영됩니다.

## 부서별 배포 설정

코드베이스는 하나이고, 부서별로 Vercel 프로젝트를 따로 만들어 환경변수만 다르게 설정합니다.

| 변수 | 카드운영부 | 공통업무지원부 |
|------|-----------|---------------|
| `VITE_API_BASE_URL` | `https://calendar-backend-<...>.run.app/api` | `https://calendar-backend-common-<...>.run.app/api` |
| `VITE_DEPT_NAME` | `카드운영부` | `공통업무지원부` |

## 주의사항

- `VITE_API_BASE_URL`에서 `/api`를 빼면 백엔드 라우트(`/api/auth`, `/api/events` 등)와 맞지 않아 모든 요청이 404가 됩니다.
- 환경 변수는 `VITE_` 접두사가 필요합니다 (Vite 요구사항).
- Vite는 빌드 시점에 환경변수를 값으로 치환합니다. 환경변수를 바꾸면 **재빌드/재배포**가 필요합니다.
- `VITE_API_BASE_URL`을 설정하지 않으면 `http://localhost:3001/api`로 요청합니다.
