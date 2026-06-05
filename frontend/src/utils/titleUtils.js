// 일정 제목에서 작성자 이름과 실제 내용을 분리/조합하는 유틸리티
//
// 저장 형식(신규): "(이름) 내용"  ← 이름이 제목 앞쪽
// 레거시 형식:      "내용 (이름)"  ← 이름이 제목 뒤쪽
// 두 형식 모두 파싱할 수 있도록 처리한다.

/**
 * 제목 문자열에서 작성자 이름과 내용을 분리한다.
 * @param {string} rawTitle
 * @returns {{ name: string, content: string }}
 */
export function parseEventTitle(rawTitle) {
  const title = (rawTitle || '').trim()
  if (!title) return { name: '', content: '' }

  // 앞쪽 "(이름) 내용" 형식
  const leading = title.match(/^\(([^)]+)\)\s*([\s\S]*)$/)
  if (leading) {
    return { name: leading[1].trim(), content: leading[2].trim() }
  }

  // 뒤쪽 "내용 (이름)" 형식 (레거시)
  const trailing = title.match(/^([\s\S]*?)\s*\(([^)]+)\)\s*$/)
  if (trailing) {
    return { name: trailing[2].trim(), content: trailing[1].trim() }
  }

  return { name: '', content: title }
}

/**
 * 작성자 이름을 앞쪽에 둔 제목 문자열을 만든다.
 * @param {string} name
 * @param {string} content
 * @returns {string}
 */
export function buildEventTitle(name, content) {
  const n = (name || '').trim()
  const c = (content || '').trim()
  if (!n) return c
  return c ? `(${n}) ${c}` : `(${n})`
}

/**
 * 표시용으로 이름을 앞쪽에 둔 형태로 정규화한다.
 * 제목에 이름이 없으면 fallbackName(작성자)을 사용한다.
 * @param {string} rawTitle
 * @param {string} fallbackName
 * @returns {string}
 */
export function formatDisplayTitle(rawTitle, fallbackName) {
  const { name, content } = parseEventTitle(rawTitle)
  const finalName = name || (fallbackName || '').trim()
  return buildEventTitle(finalName, content)
}

/**
 * 이름을 제외한 내용만 반환한다.
 * @param {string} rawTitle
 * @returns {string}
 */
export function getTitleContent(rawTitle) {
  return parseEventTitle(rawTitle).content
}
