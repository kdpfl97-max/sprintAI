import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ensureTeamId } from '../lib/team'

export function useCapacityHistoryStore() {
  const [history, setHistory] = useState([]) // [{ sprintId, memberName, total, overdue }]

  useEffect(() => {
    ensureTeamId().then(async (tid) => {
      const [{ data: rows }, { data: members }] = await Promise.all([
        supabase.from('capacity_history').select('*').eq('team_id', tid).order('closed_at', { ascending: true }),
        supabase.from('team_members').select('id, profiles(name)').eq('team_id', tid),
      ])
      const nameById = Object.fromEntries((members || []).map(m => [m.id, m.profiles.name]))
      setHistory((rows || []).map(r => ({
        sprintId: r.sprint_id,
        memberName: nameById[r.member_id],
        total: r.total_count,
        overdue: r.overdue_count,
      })).filter(r => r.memberName))
    })
  }, [])

  // ponytail: capacity_history는 완료된 스프린트/태스크에서 파생되는 뷰라 별도 기록이 필요 없음 — no-op 유지(호출부 호환용)
  function recordSprint() {}

  /** 최근 N개 스프린트 기준 멤버 초과율 */
  function getMemberStats(name, lastN = 3) {
    const relevant = history.filter(h => h.memberName === name).slice(-lastN)
    if (relevant.length === 0) return null
    let total = 0, overdue = 0
    relevant.forEach(h => { total += h.total; overdue += h.overdue })
    if (total === 0) return null
    return { sprints: relevant.length, total, overdue, rate: Math.round((overdue / total) * 100) }
  }

  return { history, recordSprint, getMemberStats }
}
