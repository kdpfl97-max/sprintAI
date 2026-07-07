import { useState, useEffect } from 'react'
import { useNotificationStore } from './useNotificationStore'

const STORAGE_KEY = 'sprintai_sprint'

// 기본 스프린트 데이터 (빌더에서 확정하기 전 기본값)
const DEFAULT_SPRINT = {
  name: 'Sprint 1 — 핵심 AI 기능',
  status: 'active',
  startedAt: '2026-07-01T09:00:00.000Z',
  startDate: '2026.07.01',
  endDate: '2026.07.14',
  tasks: [
    { id: 't1',  title: '구글 소셜 로그인',             priority: 'Must',   estimatedHours: 8,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100, startDate: '2026-07-01', dueDate: '2026-07-02', blocker: null },
    { id: 't2',  title: '팀 생성 API',                  priority: 'Must',   estimatedHours: 8,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100, startDate: '2026-07-01', dueDate: '2026-07-03', blocker: null },
    { id: 't3',  title: '팀 초대 이메일 발송',           priority: 'Must',   estimatedHours: 4,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100, startDate: '2026-07-02', dueDate: '2026-07-03', blocker: null },
    { id: 't4',  title: 'DB 스키마 설계',                priority: 'Must',   estimatedHours: 6,  status: 'done',       member: { name: '이민수', color: '#8B5CF6', initials: '이' }, progress: 100, startDate: '2026-07-01', dueDate: '2026-07-02', blocker: null },
    { id: 't5',  title: '카카오 로그인 연동',             priority: 'Must',   estimatedHours: 4,  status: 'done',       member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 100, startDate: '2026-07-03', dueDate: '2026-07-04', blocker: null },
    { id: 't6',  title: '전체 할 일 CRUD — API 개발',   priority: 'Must',   estimatedHours: 10, status: 'inprogress', member: { name: '박준혁', color: '#2E75B6', initials: '박' }, progress: 70,  startDate: '2026-07-01', dueDate: '2026-07-05', blocker: null },
    { id: 't7',  title: '전체 할 일 CRUD — 프론트 UI',  priority: 'Must',   estimatedHours: 6,  status: 'inprogress', member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 50,  startDate: '2026-07-02', dueDate: '2026-07-05', blocker: 't6' },
    { id: 't8',  title: '스프린트 화면 디자인 시안',      priority: 'Must',   estimatedHours: 6,  status: 'inprogress', member: { name: '최지은', color: '#F59E0B', initials: '최' }, progress: 80,  startDate: '2026-07-01', dueDate: '2026-07-04', blocker: null },
    { id: 't9',  title: 'Capacity 입력 화면 구현',       priority: 'Must',   estimatedHours: 8,  status: 'todo',       member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 0,   startDate: '2026-07-06', dueDate: '2026-07-08', blocker: 't7' },
    { id: 't10', title: 'AI 계획 초안 알고리즘',          priority: 'Must',   estimatedHours: 20, status: 'todo',       member: { name: '이민수', color: '#8B5CF6', initials: '이' }, progress: 0,   startDate: '2026-07-05', dueDate: '2026-07-10', blocker: null },
    { id: 't11', title: 'AI 계획 초안 UI 연동',           priority: 'Must',   estimatedHours: 8,  status: 'todo',       member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 0,   startDate: '2026-07-10', dueDate: '2026-07-12', blocker: 't10' },
    { id: 't12', title: '랜딩 페이지 디자인',             priority: 'Should', estimatedHours: 8,  status: 'todo',       member: { name: '최지은', color: '#F59E0B', initials: '최' }, progress: 0,   startDate: '2026-07-08', dueDate: '2026-07-14', blocker: null },
    { id: 't13', title: 'AI 태스크 분해 API 연동',        priority: 'Must',   estimatedHours: 12, status: 'inprogress', member: { name: '이민수', color: '#8B5CF6', initials: '이' }, progress: 0,   startDate: '2026-07-03', dueDate: '2026-07-08', blocker: null },
    { id: 't14', title: '스프린트 확정 화면 구현',         priority: 'Must',   estimatedHours: 8,  status: 'inprogress', member: { name: '김서연', color: '#22C55E', initials: '김' }, progress: 0,   startDate: '2026-07-07', dueDate: '2026-07-08', blocker: 't9' },
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
  const { push: pushNotif } = useNotificationStore()

  useEffect(() => { save(sprint) }, [sprint])

  /** 빌더에서 확정할 때 호출 */
  function confirmSprint(name, aiTasks, meta = {}) {
    const tasks = aiTasks.map((t, idx) => ({
      id: `t${idx + 1}`,
      title: t.title,
      priority: t.priority,
      estimatedHours: t.estimatedHours || 0,
      status: 'todo',
      member: t.member,
      progress: 0,
      startDate: meta.startDate || null,
      dueDate: null,
      blocker: null,
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
    if (newStatus === 'done') {
      const unblocked = sprint.tasks.filter(t => t.blocker === taskId && t.status !== 'done' && t.member)
      const finished = sprint.tasks.find(t => t.id === taskId)
      unblocked.forEach(t => {
        pushNotif({
          icon: '🚀',
          title: `시작 가능 — ${t.title}`,
          body: `${t.member.name}님, "${finished?.title || '선행 업무'}"가 완료되어 이제 "${t.title}"를 시작할 수 있어요.`,
        })
      })
    }
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

  /** 태스크 필드 일괄 업데이트 (outputLink 등) */
  function updateTask(taskId, patch) {
    setSprint(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t),
    }))
  }

  /** 스프린트 종료: completed 처리 + 미완료 태스크 목록 반환 (백로그 이월은 호출부에서) */
  function closeSprint() {
    const incomplete = sprint.tasks.filter(t => t.status !== 'done')
    setSprint(prev => ({ ...prev, status: 'completed', closedAt: new Date().toISOString() }))
    return incomplete
  }

  return { sprint, confirmSprint, moveTask, updateProgress, updateNote, updateTask, closeSprint }
}
