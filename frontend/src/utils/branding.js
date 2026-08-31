// 부서별 배포에서 부서명만 환경변수로 바꿔 재사용한다.
// VITE_DEPT_NAME 미설정 시 기존 카드운영부 배포 동작을 유지한다.
export const DEPT_NAME = import.meta.env.VITE_DEPT_NAME?.trim() || '카드운영부'

export const APP_TITLE = `${DEPT_NAME} 팀캘린더`

export const HEADER_TITLE = `${DEPT_NAME} 캘린더`
