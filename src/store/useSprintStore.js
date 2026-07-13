import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ensureTeamId } from '../lib/team'
import { useNotificationStore } from './useNotificationStore'

// 활성 스프린트가 없을 때의 기본값 — startDate/endDate는 null이면 화면 곳곳의 날짜 계산이 깨지므로 오늘 날짜로 채움
const todayISO = () => new Date().toISOString().slice(0, 10)
const EMPTY_SPRINT = { name: '', status: 'active', startDate: todayISO(), endDate: todayISO(), startedAt: null, tasks: [] }

function toTask(row) {
  const member = row.member
    ? { id: row.member.id, name: row.member.profiles.name, color: row.member.profiles.color, initials: row.member.profiles.initials }
    : null
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    estimatedHours: row.estimated_hours,
    status: row.status,
    member,
    progress: row.progress,
    startDate: row.start_date,
    dueDate: row.due_date,
    blocker: row.blocker_id,
    note: row.note,
    outputLink: row.output_link,
    updatedAt: row.updated_at,
  }
}

const TASK_SELECT = 'id, title, priority, estimated_hours, status, progress, start_date, due_date, blocker_id, note, output_link, updated_at, member:member_id(id, profiles(name, color, initials))'

export function useSprintStore() {
  const [teamId, setTeamId] = useState(null)
  const [sprint, setSprint] = useState(EMPTY_SPRINT)
  const { push: pushNotif } = useNotificationStore()

  const reload = useCallback(async (tid) => {
    const { data: s } = await supabase
      .from('sprints').select('*').eq('team_id', tid).eq('status', 'active')
      .order('started_at', { ascending: false }).limit(1).maybeSingle()
    if (!s) { setSprint(EMPTY_SPRINT); return }
    const { data: tasks } = await supabase.from('tasks').select(TASK_SELECT).eq('sprint_id', s.id)
    setSprint({
      id: s.id,
      name: s.name,
      status: s.status,
      startDate: s.start_date,
      endDate: s.end_date,
      startedAt: s.started_at,
      tasks: (tasks || []).map(toTask),
    })
  }, [])

  useEffect(() => {
    let channel
    ensureTeamId().then((tid) => {
      setTeamId(tid)
      reload(tid)
      // 채널명에 랜덤 suffix — 같은 훅을 여러 컴포넌트가 동시에 마운트해도 채널 이름이 겹치지 않게 함
      channel = supabase
        .channel(`tasks-${tid}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => reload(tid))
        .subscribe()
    })
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [reload])

  /** 빌더에서 확정할 때 호출 — 기존 활성 스프린트가 있으면 종료 처리 후 새로 생성 (팀당 활성 1개 제약) */
  async function confirmSprint(name, aiTasks, meta = {}) {
    await supabase.from('sprints').update({ status: 'completed', closed_at: new Date().toISOString() })
      .eq('team_id', teamId).eq('status', 'active')

    const { data: newSprint, error } = await supabase.from('sprints').insert({
      team_id: teamId, name,
      start_date: meta.startDate || new Date().toISOString().slice(0, 10),
      end_date: meta.endDate || new Date().toISOString().slice(0, 10),
      goal: meta.goal || '',
    }).select('id').single()
    if (error) throw error

    const rows = aiTasks.map(t => ({
      sprint_id: newSprint.id,
      title: t.title,
      priority: t.priority,
      estimated_hours: t.estimatedHours || 0,
      status: 'todo',
      progress: 0,
      member_id: t.member?.id || null,
      start_date: meta.startDate || null,
    }))
    if (rows.length) await supabase.from('tasks').insert(rows)
    await reload(teamId)
  }

  /** 카드 상태 변경 (todo → inprogress → done) */
  async function moveTask(taskId, newStatus) {
    const finished = sprint.tasks.find(t => t.id === taskId)
    const progress = newStatus === 'done' ? 100 : newStatus === 'inprogress' ? 10 : 0
    await supabase.from('tasks').update({ status: newStatus, progress, updated_at: new Date().toISOString() }).eq('id', taskId)

    if (newStatus === 'done') {
      if (finished && finished.status !== 'review') {
        pushNotif({
          type: 'success',
          title: `완료 — ${finished.title}`,
          body: `${finished.member?.name ? `${finished.member.name}님이 ` : ''}"${finished.title}"을(를) 완료로 변경했어요.`,
        })
      }
      const unblocked = sprint.tasks.filter(t => t.blocker === taskId && t.status !== 'done' && t.member)
      unblocked.forEach(t => {
        pushNotif({
          type: 'unblocked',
          title: `시작 가능 — ${t.title}`,
          body: `${t.member.name}님, "${finished?.title || '선행 업무'}"가 완료되어 이제 "${t.title}"를 시작할 수 있어요.`,
        })
      })
    }
    await reload(teamId)
  }

  async function updateProgress(taskId, progress) {
    setSprint(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, progress } : t) }))
    await supabase.from('tasks').update({ progress, updated_at: new Date().toISOString() }).eq('id', taskId)
  }

  async function updateNote(taskId, note) {
    setSprint(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, note } : t) }))
    await supabase.from('tasks').update({ note, updated_at: new Date().toISOString() }).eq('id', taskId)
  }

  async function updateTask(taskId, patch) {
    const dbPatch = { updated_at: new Date().toISOString() }
    if ('outputLink' in patch) dbPatch.output_link = patch.outputLink
    if ('dueDate' in patch) dbPatch.due_date = patch.dueDate
    if ('title' in patch) dbPatch.title = patch.title
    if ('member' in patch) dbPatch.member_id = patch.member?.id || null
    setSprint(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) }))
    await supabase.from('tasks').update(dbPatch).eq('id', taskId)
  }

  /** 스프린트 종료: completed 처리 + 미완료 태스크 목록 반환 (백로그 이월은 호출부에서) */
  async function closeSprint() {
    const incomplete = sprint.tasks.filter(t => t.status !== 'done')
    await supabase.from('sprints').update({ status: 'completed', closed_at: new Date().toISOString() }).eq('id', sprint.id)
    await reload(teamId)
    return incomplete
  }

  return { sprint, confirmSprint, moveTask, updateProgress, updateNote, updateTask, closeSprint }
}
