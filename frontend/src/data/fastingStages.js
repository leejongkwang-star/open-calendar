// 단식 시간대별 신체 변화 데이터
// hour: 해당 단계가 시작되는 경과 시간(시간 단위)
// 과학적으로 알려진 일반적인 공복/단식 반응을 기반으로 하며, 개인차가 있습니다.

export const FASTING_STAGES = [
  {
    hour: 0,
    title: '식사 직후 · 소화 단계',
    emoji: '🍽️',
    color: '#f97316', // orange-500
    short: '소화 & 흡수',
    body: '방금 먹은 음식을 소화하고 영양분을 흡수합니다. 혈당과 인슐린 수치가 올라갑니다.',
    details: [
      '혈당·인슐린 상승',
      '에너지를 지방·글리코겐으로 저장',
      '소화기관 활발히 작동',
    ],
  },
  {
    hour: 4,
    title: '흡수 후기 · 혈당 안정화',
    emoji: '🩸',
    color: '#eab308', // yellow-500
    short: '혈당 안정',
    body: '소화가 대부분 끝나고 혈당과 인슐린이 정상 수준으로 내려갑니다. 저장된 글리코겐을 에너지로 쓰기 시작합니다.',
    details: [
      '혈당·인슐린 하강 시작',
      '간 글리코겐 사용 시작',
      '공복감이 나타날 수 있음',
    ],
  },
  {
    hour: 8,
    title: '공복 단계 · 글리코겐 소모',
    emoji: '🔋',
    color: '#84cc16', // lime-500
    short: '글리코겐 소모',
    body: '간에 저장된 글리코겐을 주 에너지원으로 사용합니다. 몸이 저장 모드에서 소비 모드로 전환됩니다.',
    details: [
      '간 글리코겐 본격 소모',
      '인슐린 수치 낮게 유지',
      '지방 분해가 서서히 시작',
    ],
  },
  {
    hour: 12,
    title: '대사 전환 · 지방 연소 시작',
    emoji: '🔥',
    color: '#22c55e', // green-500
    short: '지방 연소 시작',
    body: '글리코겐이 거의 소진되어 몸이 지방을 분해해 에너지로 쓰기 시작합니다. 케톤 생성이 시작됩니다.',
    details: [
      '지방 연소(지방산 분해) 시작',
      '케톤 생성 시작',
      '‘대사 전환(metabolic switch)’ 구간',
    ],
  },
  {
    hour: 16,
    title: '케토시스 진입 · 오토파지 시작',
    emoji: '♻️',
    color: '#14b8a6', // teal-500
    short: '오토파지 시작',
    body: '케톤이 주요 에너지원이 되며, 손상된 세포 성분을 청소하는 오토파지(autophagy)가 서서히 활성화됩니다.',
    details: [
      '케토시스 진입',
      '오토파지(세포 청소) 시작',
      '집중력·정신 명료함 상승 보고',
    ],
  },
  {
    hour: 18,
    title: '지방 연소 가속 · 성장호르몬 상승',
    emoji: '💪',
    color: '#06b6d4', // cyan-500
    short: '성장호르몬 ↑',
    body: '지방 연소가 활발해지고 성장호르몬(HGH) 분비가 늘어 근육 보존과 대사에 도움을 줍니다.',
    details: [
      '지방 연소 최고조로 진행',
      '성장호르몬 분비 증가',
      '케톤 수치 꾸준히 상승',
    ],
  },
  {
    hour: 24,
    title: '오토파지 본격화 · 세포 재생',
    emoji: '🧬',
    color: '#3b82f6', // blue-500
    short: '세포 재생',
    body: '오토파지가 본격적으로 진행되어 손상된 단백질과 세포를 재활용합니다. 항염증 효과가 나타나기 시작합니다.',
    details: [
      '오토파지 활발',
      '세포 재생·재활용 촉진',
      '염증 지표 감소 시작',
    ],
  },
  {
    hour: 36,
    title: '심화 케토시스 · 항염증',
    emoji: '🌿',
    color: '#6366f1', // indigo-500
    short: '항염증 강화',
    body: '케톤 수치가 높게 유지되고, 인슐린 민감성이 개선되며 염증이 줄어듭니다. 지방 연소 효율이 극대화됩니다.',
    details: [
      '인슐린 민감성 개선',
      '지방 연소 효율 극대화',
      '항염증 효과 강화',
    ],
  },
  {
    hour: 48,
    title: '면역 재생 · 성장호르몬 최대',
    emoji: '🛡️',
    color: '#8b5cf6', // violet-500
    short: '면역 재생',
    body: '성장호르몬이 크게 증가하고, 오래된 면역세포가 분해되며 새로운 면역세포 생성이 촉진됩니다.',
    details: [
      '성장호르몬 대폭 증가',
      '면역세포 재생 촉진',
      '⚠️ 장기 단식은 전문가 상담 권장',
    ],
  },
  {
    hour: 72,
    title: '면역 시스템 리셋 · 줄기세포 활성',
    emoji: '⭐',
    color: '#a855f7', // purple-500
    short: '면역 리셋',
    body: '오래된 면역세포가 재활용되고 줄기세포 기반의 재생이 활발해집니다. 매우 긴 단식이므로 반드시 의료 전문가의 관리가 필요합니다.',
    details: [
      '면역 시스템 재생(리셋)',
      '줄기세포 활성 증가',
      '⚠️ 반드시 전문가 관리 하에 진행',
    ],
  },
]

// 경과 시간(시간 단위)에 해당하는 현재 단계 인덱스 반환
export function getCurrentStageIndex(elapsedHours) {
  let idx = 0
  for (let i = 0; i < FASTING_STAGES.length; i++) {
    if (elapsedHours >= FASTING_STAGES[i].hour) {
      idx = i
    } else {
      break
    }
  }
  return idx
}

// 다음 단계까지 남은 시간 정보 반환 (없으면 null)
export function getNextStage(elapsedHours) {
  for (let i = 0; i < FASTING_STAGES.length; i++) {
    if (FASTING_STAGES[i].hour > elapsedHours) {
      return {
        stage: FASTING_STAGES[i],
        hoursUntil: FASTING_STAGES[i].hour - elapsedHours,
      }
    }
  }
  return null
}
