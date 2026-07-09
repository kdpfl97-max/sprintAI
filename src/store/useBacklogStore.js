import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ensureTeamId } from '../lib/team'

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

const SELECT = `
  id, title, description, category, priority, stage, estimated_hours, difficulty,
  status, due_date, done_condition, output_link, captured_by, last_updated_at,
  backlog_item_assignees(member_id),
  backlog_item_blockers!backlog_item_blockers_backlog_item_id_fkey(blocked_by_id)
`

function toItem(row) {
  return {
    id: row.id,
    title: row.title,
    desc: row.description || '',
    category: row.category,
    priority: row.priority,
    stage: row.stage,
    estimatedHours: row.estimated_hours,
    difficulty: row.difficulty,
    status: row.status,
    dueDate: row.due_date,
    doneCondition: row.done_condition || '',
    outputLink: row.output_link || '',
    capturedBy: row.captured_by,
    assignees: (row.backlog_item_assignees || []).map(a => a.member_id),
    blockedBy: (row.backlog_item_blockers || []).map(b => b.blocked_by_id),
    lastUpdatedAt: row.last_updated_at,
  }
}

async function syncAssignees(itemId, assignees = []) {
  await supabase.from('backlog_item_assignees').delete().eq('backlog_item_id', itemId)
  if (assignees.length) {
    await supabase.from('backlog_item_assignees').insert(assignees.map(member_id => ({ backlog_item_id: itemId, member_id })))
  }
}

async function syncBlockers(itemId, blockedBy = []) {
  await supabase.from('backlog_item_blockers').delete().eq('backlog_item_id', itemId)
  if (blockedBy.length) {
    await supabase.from('backlog_item_blockers').insert(blockedBy.map(blocked_by_id => ({ backlog_item_id: itemId, blocked_by_id })))
  }
}

export function useBacklogStore() {
  const [teamId, setTeamId] = useState(null)
  const [items, setItems] = useState([])

  const reload = useCallback(async (tid) => {
    const { data } = await supabase.from('backlog_items').select(SELECT).eq('team_id', tid)
    setItems((data || []).map(toItem))
  }, [])

  useEffect(() => {
    ensureTeamId().then(async (tid) => { setTeamId(tid); await reload(tid) })
  }, [reload])

  async function add(item, capturedBy = null) {
    const { assignees = [], blockedBy = [], desc, ...rest } = { ...EMPTY_ITEM, ...item }
    const { data: created, error } = await supabase.from('backlog_items').insert({
      team_id: teamId,
      title: rest.title,
      description: desc,
      category: rest.category,
      priority: rest.priority,
      stage: rest.stage,
      estimated_hours: Number(rest.estimatedHours) || 0,
      difficulty: rest.difficulty,
      status: rest.status,
      due_date: rest.dueDate,
      done_condition: rest.doneCondition,
      output_link: rest.outputLink,
      captured_by: capturedBy,
      last_updated_at: new Date().toISOString(),
    }).select('id').single()
    if (error) throw error
    await Promise.all([syncAssignees(created.id, assignees), syncBlockers(created.id, blockedBy)])
    await reload(teamId)
  }

  async function update(id, patch) {
    const dbPatch = { last_updated_at: new Date().toISOString() }
    if ('title' in patch) dbPatch.title = patch.title
    if ('desc' in patch) dbPatch.description = patch.desc
    if ('category' in patch) dbPatch.category = patch.category
    if ('priority' in patch) dbPatch.priority = patch.priority
    if ('stage' in patch) dbPatch.stage = patch.stage
    if ('estimatedHours' in patch) dbPatch.estimated_hours = Number(patch.estimatedHours) || 0
    if ('difficulty' in patch) dbPatch.difficulty = patch.difficulty
    if ('status' in patch) dbPatch.status = patch.status
    if ('dueDate' in patch) dbPatch.due_date = patch.dueDate
    if ('doneCondition' in patch) dbPatch.done_condition = patch.doneCondition
    if ('outputLink' in patch) dbPatch.output_link = patch.outputLink
    await supabase.from('backlog_items').update(dbPatch).eq('id', id)
    if ('assignees' in patch) await syncAssignees(id, patch.assignees)
    if ('blockedBy' in patch) await syncBlockers(id, patch.blockedBy)
    await reload(teamId)
  }

  async function remove(id) {
    await supabase.from('backlog_items').delete().eq('id', id)
    await reload(teamId)
  }

  return { items, add, update, remove }
}
