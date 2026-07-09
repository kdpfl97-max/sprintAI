import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ensureTeamId } from '../lib/team'

function toEvent(row) {
  return { id: row.id, date: row.event_date, title: row.title }
}

export function useScheduleStore() {
  const [teamId, setTeamId] = useState(null)
  const [events, setEvents] = useState([])

  const reload = useCallback(async (tid) => {
    const { data } = await supabase.from('schedule_events').select('*').eq('team_id', tid)
    setEvents((data || []).map(toEvent))
  }, [])

  useEffect(() => {
    ensureTeamId().then(async (tid) => { setTeamId(tid); await reload(tid) })
  }, [reload])

  async function addEvent(date, title) {
    if (!title?.trim() || !teamId) return
    await supabase.from('schedule_events').insert({ team_id: teamId, event_date: date, title: title.trim() })
    await reload(teamId)
  }

  async function removeEvent(id) {
    await supabase.from('schedule_events').delete().eq('id', id)
    await reload(teamId)
  }

  return { events, addEvent, removeEvent }
}
