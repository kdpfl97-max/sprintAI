import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sprintai_backlog_v2'

// 상태값: 미배정 / 예정 / 진행 중 / 검토 중 / 완료 / 블로커
// 난이도: 낮음 / 보통 / 높음
const DEFAULT_ITEMS = [
  {
    id: 1,
    title: '소셜 로그인 (구글)',
    category: '기능',
    priority: 'Must',
    stage: 'MVP',
    // 구 points 제거 → 예상 시간 + 난이도로 분리
    estimatedHours: 8,
    difficulty: '보통',
    desc: '구글 OAuth 2.0 연동 로그인',
    capturedBy: 'm0',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '구글 계정으로 로그인 후 팀 페이지에 진입할 수 있다',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 2,
    title: '팀 생성 및 초대',
    category: '에픽',
    priority: 'Must',
    stage: 'MVP',
    estimatedHours: 12,
    difficulty: '보통',
    desc: '팀 워크스페이스 생성, 이메일 초대',
    capturedBy: 'm0',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '팀장이 팀을 만들고 팀원을 초대해 함께 로그인할 수 있다',
    outputLink: '',
    blockedBy: [1],
    lastUpdatedAt: null,
  },
  {
    id: 3,
    title: '전체 할 일 CRUD',
    category: '기능',
    priority: 'Must',
    stage: 'MVP',
    estimatedHours: 10,
    difficulty: '보통',
    desc: '에픽/태스크 생성·수정·삭제·정렬',
    capturedBy: 'm1',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '태스크를 추가·수정·삭제하고 필터로 조회할 수 있다',
    outputLink: '',
    blockedBy: [2],
    lastUpdatedAt: null,
  },
  {
    id: 4,
    title: 'AI 이번 계획 만들기',
    category: '기능',
    priority: 'Must',
    stage: 'MVP',
    estimatedHours: 20,
    difficulty: '높음',
    desc: '전체 할 일 → AI 스프린트 자동 구성 + 추천 이유 표시',
    capturedBy: 'm0',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: 'AI 초안에 추천 이유가 표시되고 PM이 수정 후 확정할 수 있다',
    outputLink: '',
    blockedBy: [3],
    lastUpdatedAt: null,
  },
  {
    id: 5,
    title: 'Capacity 입력',
    category: '기능',
    priority: 'Must',
    stage: 'MVP',
    estimatedHours: 6,
    difficulty: '낮음',
    desc: '팀원별 스프린트 가용 시간 입력',
    capturedBy: 'm3',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '팀원이 이번 기간 참여 가능 시간을 입력하면 AI가 배정에 반영한다',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 6,
    title: '칸반 보드',
    category: '기능',
    priority: 'Must',
    stage: 'MVP',
    estimatedHours: 12,
    difficulty: '보통',
    desc: '예정 / 진행 중 / 검토 중 / 완료 + 블로커 배지',
    capturedBy: 'm2',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '팀원이 카드를 이동하면 상태가 바뀌고 블로커가 배지로 표시된다',
    outputLink: '',
    blockedBy: [3],
    lastUpdatedAt: null,
  },
  {
    id: 7,
    title: 'AI 태스크 분해기',
    category: '기능',
    priority: 'Must',
    stage: 'MVP',
    estimatedHours: 16,
    difficulty: '높음',
    desc: '에픽 → 스토리 → 태스크 자동 분해',
    capturedBy: 'm3',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '에픽을 입력하면 AI가 하위 태스크 목록을 제안하고 편집할 수 있다',
    outputLink: '',
    blockedBy: [3],
    lastUpdatedAt: null,
  },
  {
    id: 8,
    title: '스프린트 대시보드',
    category: '기능',
    priority: 'Should',
    stage: 'MVP',
    estimatedHours: 12,
    difficulty: '보통',
    desc: 'PM용 확인 필요 항목 + 팀원용 내 할 일 중심',
    capturedBy: 'm4',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: 'PM은 미배정·블로커를 3분 내 파악하고 팀원은 10초 내 할 일을 찾는다',
    outputLink: '',
    blockedBy: [6],
    lastUpdatedAt: null,
  },
  {
    id: 9,
    title: '슬랙 연동',
    category: '기능',
    priority: 'Should',
    stage: 'v1.0',
    estimatedHours: 10,
    difficulty: '보통',
    desc: '스프린트 알림, 태스크 상태 업데이트',
    capturedBy: 'm1',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 10,
    title: '회고 리포트 AI 생성',
    category: '기능',
    priority: 'Should',
    stage: 'v1.0',
    estimatedHours: 10,
    difficulty: '보통',
    desc: 'AI 자동 스프린트 회고 생성',
    capturedBy: 'm0',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 11,
    title: '노션 연동',
    category: '기능',
    priority: 'Should',
    stage: 'v1.0',
    estimatedHours: 8,
    difficulty: '보통',
    desc: '스프린트 보드 노션 자동 동기화',
    capturedBy: 'm4',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 12,
    title: '팀원 업무 부하 히트맵',
    category: '기능',
    priority: 'Could',
    stage: 'v1.0',
    estimatedHours: 6,
    difficulty: '낮음',
    desc: '팀원별 업무 부하 시각화',
    capturedBy: 'm2',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 13,
    title: 'GitHub 이슈 연동',
    category: '기능',
    priority: 'Could',
    stage: 'v2.0',
    estimatedHours: 12,
    difficulty: '높음',
    desc: 'GitHub 이슈 → 전체 할 일 자동 가져오기',
    capturedBy: 'm1',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 14,
    title: '모바일 앱 (iOS)',
    category: '기능',
    priority: 'Could',
    stage: 'v2.0',
    estimatedHours: 40,
    difficulty: '높음',
    desc: 'iOS 네이티브 앱',
    capturedBy: 'm0',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
  {
    id: 15,
    title: 'AI PM 코치',
    category: '기능',
    priority: 'Could',
    stage: 'v2.0',
    estimatedHours: 20,
    difficulty: '높음',
    desc: '스프린트 개선 조언 AI 코치',
    capturedBy: 'm3',
    assignees: [],
    status: '미배정',
    dueDate: null,
    doneCondition: '',
    outputLink: '',
    blockedBy: [],
    lastUpdatedAt: null,
  },
]

function migrate(items) {
  // assignee(string) → assignees(array) 마이그레이션
  return items.map(i => {
    if (!('assignees' in i)) {
      const { assignee, ...rest } = i
      return { ...rest, assignees: assignee ? [assignee] : [] }
    }
    return i
  })
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ITEMS
    const parsed = JSON.parse(raw)
    if (!parsed.length) return DEFAULT_ITEMS
    return migrate(parsed)
  } catch {
    return DEFAULT_ITEMS
  }
}

function save(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

const EMPTY_ITEM = {
  title: '',
  desc: '',
  category: '기능',
  priority: 'Must',
  stage: 'MVP',
  estimatedHours: '',
  difficulty: '보통',
  status: '미배정',
  assignees: [],
  dueDate: null,
  doneCondition: '',
  outputLink: '',
  blockedBy: [],
}

export { EMPTY_ITEM }

export function useBacklogStore() {
  const [items, setItems] = useState(load)

  useEffect(() => { save(items) }, [items])

  const add = (item, capturedBy = null) =>
    setItems(prev => [
      ...prev,
      {
        ...EMPTY_ITEM,
        ...item,
        id: Date.now(),
        estimatedHours: Number(item.estimatedHours) || 0,
        capturedBy,
        lastUpdatedAt: new Date().toISOString(),
      },
    ])

  const update = (id, patch) =>
    setItems(prev =>
      prev.map(i =>
        i.id === id
          ? {
              ...i,
              ...patch,
              estimatedHours: Number(patch.estimatedHours ?? i.estimatedHours),
              lastUpdatedAt: new Date().toISOString(),
            }
          : i
      )
    )

  const remove = (id) =>
    setItems(prev => prev.filter(i => i.id !== id))

  return { items, add, update, remove }
}
