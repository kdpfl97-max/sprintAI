// 규칙 기반 AI 조언 엔진 — 외부 API 호출 없음. 제안만 하고 실행은 항상 사용자 확정.
import { parseDate } from './dashboardSelectors'

function isBlocked(task, tasks) {
  return !!task.blocker && !!tasks.find(b => b.id === task.blocker && b.status !== 'done')
}

/** PM용 조언 3종 — 재배정 / 캐파 조정 / 분할 */
export function generatePMAdvice({ tasks, teamMembers, getMemberStats }) {
  const advice = []
  const active = tasks.filter(t => t.status !== 'done')

  // a. 재배정 제안 — 과부하 멤버의 선행 의존 없는 태스크를 여유 멤버에게
  const workByMember = {}
  active.forEach(t => {
    if (!t.member) return
    const k = t.member.name
    if (!workByMember[k]) workByMember[k] = []
    workByMember[k].push(t)
  })
  const capOf = name => teamMembers.find(m => m.name === name)?.capacity ?? 80
  const hoursOf = list => list.reduce((s, t) => s + (t.estimatedHours || 0), 0)

  const overloaded = Object.entries(workByMember)
    .map(([name, list]) => ({ name, list, h: hoursOf(list), cap: capOf(name) }))
    .filter(m => m.h > m.cap)
    .sort((a, b) => (b.h - b.cap) - (a.h - a.cap))[0]

  const light = Object.entries(workByMember)
    .map(([name, list]) => ({ name, list, h: hoursOf(list), cap: capOf(name) }))
    .concat(teamMembers.filter(m => !workByMember[m.name] && m.role !== 'PM').map(m => ({ name: m.name, list: [], h: 0, cap: m.capacity })))
    .filter(m => m.h < m.cap * 0.7)
    .sort((a, b) => a.h - b.h)[0]

  if (overloaded && light && overloaded.name !== light.name) {
    const movable = overloaded.list.find(t => !t.blocker)
    if (movable) {
      advice.push({
        id: `reassign-${movable.id}`,
        type: 'reassign',
        message: `"${movable.title}"을(를) ${overloaded.name}님에서 ${light.name}님으로 재배정해보세요.`,
        evidence: `${overloaded.name}님 배정 ${overloaded.h}h/${overloaded.cap}h · ${light.name}님 배정 ${light.h}h/${light.cap}h`,
        action: { label: '재배정', taskId: movable.id, toMemberName: light.name },
      })
    }
  }

  // b. 캐파 조정 제안 — 최근 3개 계획 평균 초과율 15% 이상 (블로커 지연 건은 별도 언급으로 제외 명시)
  teamMembers.filter(m => m.role !== 'PM').forEach(m => {
    const stats = getMemberStats?.(m.name, 3)
    if (stats && stats.rate >= 15) {
      advice.push({
        id: `capacity-${m.id}`,
        type: 'capacity',
        message: `${m.name}님의 작업 가능 시간을 낮춰볼까요?`,
        evidence: `최근 ${stats.sprints}개 계획 평균 마감 초과율 ${stats.rate}% (블로커로 인한 지연은 제외)`,
        action: { label: '캐파 조정', memberId: m.id, memberName: m.name, suggestedRate: stats.rate },
      })
    }
  })

  // c. 분할 제안 — 예상 시간 20h 이상 태스크
  active.filter(t => (t.estimatedHours || 0) >= 20).forEach(t => {
    advice.push({
      id: `split-${t.id}`,
      type: 'split',
      message: `"${t.title}"은(는) 예상 시간이 커요. 더 작은 태스크로 나눠보세요.`,
      evidence: `예상 시간 ${t.estimatedHours}h (20h 이상은 분할 권장)`,
      action: { label: '전체 할 일에서 분할', taskId: t.id },
    })
  })

  return advice
}

/** 팀원용 조언 2종 — 오늘 배치 추천 / 시작 가능 알림 */
export function generateMemberAdvice({ tasks, currentUser }) {
  const advice = []
  const myTasks = tasks.filter(t => t.member?.name === currentUser?.name)
  const myTodo = myTasks.filter(t => t.status === 'todo' && !isBlocked(t, tasks) && t.dueDate)

  if (myTodo.length >= 2) {
    const ordered = [...myTodo].sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate))
    advice.push({
      id: `order-${ordered.map(t => t.id).join('-')}`,
      type: 'order',
      message: `마감이 빠른 순서로 진행하면 좋아요: ${ordered.map(t => t.title).join(' → ')}`,
      evidence: `마감일 기준 정렬 (${ordered.map(t => t.dueDate).join(', ')})`,
      action: { label: '확인', taskId: ordered[0].id },
    })
  }

  const readyNow = myTasks.find(t => t.status === 'todo' && !isBlocked(t, tasks))
  if (readyNow) {
    advice.push({
      id: `ready-${readyNow.id}`,
      type: 'ready',
      message: `"${readyNow.title}"는 선행 업무가 끝나서 지금 바로 시작할 수 있어요.`,
      evidence: '선행 업무 완료됨',
      action: { label: '시작하기', taskId: readyNow.id },
    })
  }

  return advice
}

const DISMISS_KEY = 'sprintai_dismissed_advice'

export function getDismissedAdviceIds() {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]') } catch { return [] }
}

export function dismissAdvice(id) {
  const list = getDismissedAdviceIds()
  if (!list.includes(id)) {
    list.push(id)
    localStorage.setItem(DISMISS_KEY, JSON.stringify(list))
  }
}
