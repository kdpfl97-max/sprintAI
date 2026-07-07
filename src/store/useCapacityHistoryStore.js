import { useState, useEffect } from 'react'

const KEY = 'sprintai_capacity_history'

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function useCapacityHistoryStore() {
  const [history, setHistory] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(history)) } catch {}
  }, [history])

  /** 스프린트 종료 시점 — 멤버별 일정 초과 이력 기록 */
  function recordSprint(sprintName, tasks) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const byMember = {}
    tasks.forEach(t => {
      if (!t.member) return
      const k = t.member.name
      if (!byMember[k]) byMember[k] = { total: 0, overdue: 0 }
      byMember[k].total += 1
      const due = t.dueDate ? new Date(t.dueDate.replace(/\./g, '-')) : null
      if (t.status !== 'done' && due && due < today) byMember[k].overdue += 1
    })
    if (Object.keys(byMember).length === 0) return
    setHistory(prev => [...prev, { sprintName, closedAt: new Date().toISOString(), members: byMember }].slice(-20))
  }

  /** 최근 N개 스프린트 기준 멤버 초과율 */
  function getMemberStats(name, lastN = 3) {
    const relevant = history.slice(-lastN).filter(h => h.members[name])
    if (relevant.length === 0) return null
    let total = 0, overdue = 0
    relevant.forEach(h => { total += h.members[name].total; overdue += h.members[name].overdue })
    if (total === 0) return null
    return { sprints: relevant.length, total, overdue, rate: Math.round((overdue / total) * 100) }
  }

  return { history, recordSprint, getMemberStats }
}
