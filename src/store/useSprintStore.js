import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sprintai_sprint'

// 기본 스프린트 데이터 (빌더에서 확정하기 전 기본값)
const DEFAULT_SPRINT = {
  name: 'Sprint 1 — 핵심 AI 기능',
  startDate: '2026.07.01',
  endDate: '2026.06.24', // ponytail: 오늘 날짜로 설정해 종료 배너 즉시 확인 가능
  tasks: [
    { id: 't1', title: '구글 소셜 로그인',       priority: 'Must',   points: 5,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100 },
    { id: 't2', title: '팀 생성 API',            priority: 'Must',   points: 5,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100 },
    { id: 't3', title: '팀 초대 이메일 발송',     priority: 'Must',   points: 3,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100 },
    { id: 't4', title: 'DB 스키마 설계',          priority: 'Must',   points: 3,  status: 'done',       member: { name: '이민수', color: '#8B5CF6', initials: '이' }, progress: 100 },
    { id: 't5', title: '카카오 로그인 연동',       priority: 'Must',   points: 3,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100 },
    { id: 't6', title: '백로그 CRUD — API 개발', priority: 'Must',   points: 5,  status: 'inprogress', member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 70  },
    { id: 't7', title: '백로그 CRUD — 프론트 UI',priority: 'Must',   points: 3,  status: 'inprogress', member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 50  },
    { id: 't8', title: '스프린트 화면 디자인 시안',priority: 'Must',   points: 3,  status: 'inprogress', member: { name: '최지은', color: '#F59E0B', initials: '최' }, progress: 80  },
    { id: 't9', title: 'Capacity 입력 화면 구현', priority: 'Must',   points: 5,  status: 'todo',       member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 0   },
    { id:'t10', title: 'AI 스프린트 빌더 알고리즘',priority: 'Must',  points: 13, status: 'todo',       member: { name: '이민수', color: '#8B5CF6', initials: '이' }, progress: 0   },
    { id:'t11', title: 'AI 스프린트 빌더 UI 연동',priority: 'Must',   points: 5,  status: 'todo',       member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 0   },
    { id:'t12', title: '랜딩 페이지 디자인',      priority: 'Should', points: 5,  status: 'todo',       member: { name: '최지은', color: '#F59E0B', initials: '최' }, progress: 0   },
    { id:'t13', title: 'AI 태스크 분해 API 연동', priority: 'Must',   points: 8,  status: 'inprogress', member: { name: '이민수', color: '#8B5CF6', initials: '이' }, progress: 0   },
    { id:'t14', title: '스프린트 확정 화면 구현',  priority: 'Must',   points: 5,  status: 'inprogress', member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 0   },
  ],
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_SPRINT
  } catch { return DEFAULT_SPRINT }
}

function save(sprint) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sprint)) } catch {}
}

export function useSprintStore() {
  const [sprint, setSprint] = useState(load)

  useEffect(() => { save(sprint) }, [sprint])

  /** 빌더에서 확정할 때 호출 */
  function confirmSprint(name, aiTasks, meta = {}) {
    const tasks = aiTasks.map((t, idx) => ({
      id: `t${idx + 1}`,
      title: t.title,
      priority: t.priority,
      points: t.points,
      status: 'todo',
      member: t.member,
      progress: 0,
    }))
    const next = {
      ...sprint, name, tasks,
      status: 'active',
      startDate: meta.startDate || sprint.startDate,
      endDate:   meta.endDate   || sprint.endDate,
      goal:      meta.goal      || '',
      startedAt: new Date().toISOString(),
    }
    setSprint(next)
    save(next)
  }

  /** 카드 상태 변경 (todo → inprogress → done) */
  function moveTask(taskId, newStatus) {
    setSprint(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, progress: newStatus === 'done' ? 100 : newStatus === 'inprogress' ? 10 : 0 }
          : t
      ),
    }))
  }

  /** 진행률 업데이트 */
  function updateProgress(taskId, progress) {
    setSprint(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, progress } : t),
    }))
  }

  /** 진행 메모 업데이트 */
  function updateNote(taskId, note) {
    setSprint(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, note } : t),
    }))
  }

  /** 스프린트 종료: completed 처리 + 미완료 태스크 목록 반환 (백로그 이월은 호출부에서) */
  function closeSprint() {
    const incomplete = sprint.tasks.filter(t => t.status !== 'done')
    setSprint(prev => ({ ...prev, status: 'completed', closedAt: new Date().toISOString() }))
    return incomplete
  }

  return { sprint, confirmSprint, moveTask, updateProgress, updateNote, closeSprint }
}
