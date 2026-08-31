// 부서별 아이콘 세트 정의. vite.config.js(빌드 시 PWA manifest)와
// branding.js(런타임 favicon)가 같은 값을 쓰도록 여기 한 곳에서만 관리한다.
// 신규 부서는 public/icons/<세트>/ 에 파일을 두고 ICON_SETS 에 한 줄 추가한다.

export const DEFAULT_DEPT_NAME = '카드운영부'

export const ICON_SETS = {
  카드운영부: 'card',
  공통업무지원부: 'common',
}

export function resolveIconSet(deptName, override) {
  return override?.trim() || ICON_SETS[deptName] || ICON_SETS[DEFAULT_DEPT_NAME]
}

export function iconPath(iconSet, size) {
  return `/icons/${iconSet}/icon-${size}x${size}.png`
}
