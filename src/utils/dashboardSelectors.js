// 대시보드 파생 데이터 selector — 컴포넌트에서 직접 계산하지 않고 여기서만 계산한다.

export function parseDate(d) {
  if (!d) return null
  return new Date(String(d).replace(/\./g, '-'))
}

function isBlocked(task, tasks) {
  return !!task.blocker && !!tasks.find(b => b.id === task.blocker && b.status !== 'done')
}

/** ① 지금 확인이 필요한 항목 — 4종, 0건이어도 카드는 유지 */
export function deriveAlerts(tasks, now = new Date()) {
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const in2 = new Date(today.getTime() + 2 * 86400000)

  const blockers = tasks.filter(t => t.status !== 'done' && isBlocked(t, tasks))
  const unassigned = tasks.filter(t => !t.member && t.status !== 'done')
  const dueSoonOrOver = tasks.filter(t => t.status !== 'done' && t.dueDate && parseDate(t.dueDate) <= in2)
  const stale = tasks.filter(t => {
    if (t.status === 'done' || !t.updatedAt) return false
    return now.getTime() - new Date(t.updatedAt).getTime() > 48 * 3600 * 1000
  })

  return { blockers, unassigned, dueSoonOrOver, stale }
}

/** ② 스프린트 궤도 — burnGap 기반 신호등 + 한 줄 요약 */
export function deriveTrajectory(sprint, tasks, now = new Date()) {
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const start = parseDate(sprint.startDate)
  const end = parseDate(sprint.endDate)
  const totalDays = Math.max(1, Math.round((end - start) / 86400000))
  const daysLeft = Math.ceil((end - today) / 86400000)
  const elapsed = Math.min(totalDays, Math.max(0, totalDays - Math.max(daysLeft, 0)))

  const totalH = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const pct = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0
  const expectedPct = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 0
  const burnGap = pct - expectedPct

  const blockerCount = tasks.filter(t => t.status !== 'done' && isBlocked(t, tasks)).length

  let status = 'safe'
  if (burnGap <= -20) status = 'danger'
  else if (burnGap <= -10) status = 'warn'

  const ratePerDay = elapsed > 0 ? doneH / elapsed : 0
  const remainH = totalH - doneH
  const projectedDaysNeeded = ratePerDay > 0 ? Math.ceil(remainH / ratePerDay) : (remainH > 0 ? Infinity : 0)
  const delayDays = Math.max(0, projectedDaysNeeded - Math.max(daysLeft, 0))

  let summary
  if (totalH === 0) {
    summary = '아직 등록된 태스크가 없어요. 이번 계획 만들기에서 태스크를 배정해보세요.'
    status = 'safe'
  } else if (status === 'safe') {
    summary = daysLeft <= 0
      ? (pct >= 100 ? '마감일 안에 모두 완료했어요.' : `마감일이 지났고 완료율은 ${pct}%예요.`)
      : `현재 속도면 마감일 안에 끝낼 수 있어요 (완료율 ${pct}%).`
  } else {
    summary = Number.isFinite(delayDays) && delayDays > 0
      ? `현재 속도면 종료일 기준 약 ${delayDays}일 지연이 예상돼요.`
      : `현재 속도로는 마감일 안에 끝내기 어려워요 (완료율 ${pct}% · 예상 ${expectedPct}%).`
    if (blockerCount > 0) summary += ` 블로커 ${blockerCount}건을 먼저 풀면 속도를 회복할 수 있어요.`
  }

  return {
    status, summary, pct, expectedPct, burnGap, daysLeft, totalDays,
    doneCount: tasks.filter(t => t.status === 'done').length,
    reviewCount: tasks.filter(t => t.status === 'review').length,
    totalCount: tasks.length,
  }
}

/** ④ 팀원별 워크로드 — 접속시간/생산성 점수 없음, 배정h/가용h만 */
export function deriveWorkload(tasks, teamMembers) {
  const map = {}
  tasks.forEach(t => {
    if (!t.member) return
    const k = t.member.name
    if (!map[k]) map[k] = { member: t.member, tasks: [] }
    map[k].tasks.push(t)
  })
  return Object.values(map).map(({ member, tasks: mt }) => {
    const cap = teamMembers.find(m => m.name === member.name)?.capacity ?? 80
    const assignedH = mt.filter(t => t.status !== 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0)
    const doneH = mt.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0)
    const pct = cap > 0 ? Math.round((assignedH / cap) * 100) : 0
    const status = pct > 100 ? 'over' : pct < 70 ? 'light' : 'normal'
    return { member, tasks: mt, assignedH, doneH, cap, pct, status, doneCnt: mt.filter(t => t.status === 'done').length }
  }).sort((a, b) => b.pct - a.pct)
}

/** 팀원 대시보드 — 지금 진행 중인 업무 */
export function deriveMemberNow(tasks, currentUser) {
  const myTasks = tasks.filter(t => t.member?.name === currentUser?.name)
  const now = myTasks.find(t => t.status === 'inprogress') || null
  return { now, myTasks }
}

/** 팀원 대시보드 — 다음 할 일 (+ 선행 상태) */
export function deriveMemberNext(tasks, currentUser) {
  const myTasks = tasks.filter(t => t.member?.name === currentUser?.name)
  const todo = myTasks.filter(t => t.status === 'todo')
  const ready = todo.filter(t => !isBlocked(t, tasks))
  const blocked = todo.filter(t => isBlocked(t, tasks))
  const ordered = [...ready, ...blocked]
  const next = ordered[0] || null
  const isReady = next ? ready.includes(next) : false
  const blockerTitle = next && !isReady ? tasks.find(b => b.id === next.blocker)?.title : null
  const preview = ordered[1] || null
  return { next, isReady, blockerTitle, preview }
}

/** 팀원 대시보드 — 내 마감 임박 업무 N건 */
export function deriveMyDeadlines(tasks, currentUser, limit = 3) {
  return tasks
    .filter(t => t.member?.name === currentUser?.name && t.status !== 'done' && t.dueDate)
    .sort((a, b) => parseDate(a.dueDate) - parseDate(b.dueDate))
    .slice(0, limit)
}

/** 팀원 대시보드 — 팀 맥락(내 업무와 관련된 블로커, 팀 진행률, 내가 막고 있는 업무) */
export function deriveTeamContext(tasks, currentUser, sprint, now = new Date()) {
  const myTasks = tasks.filter(t => t.member?.name === currentUser?.name)
  const totalH = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const teamPct = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0

  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((parseDate(sprint.endDate) - today) / 86400000)

  const blockerTasks = tasks.filter(t => t.status !== 'done' && isBlocked(t, tasks))
  const relevantBlocker = blockerTasks.find(t => {
    if (t.member?.name === currentUser?.name) return true
    const blocker = tasks.find(b => b.id === t.blocker)
    return blocker?.member?.name === currentUser?.name
  }) || null

  const iAmBlocking = tasks.filter(t =>
    t.blocker && myTasks.find(m => m.id === t.blocker && m.status !== 'done')
  )

  return { teamPct, daysLeft, relevantBlocker, iAmBlocking }
}
