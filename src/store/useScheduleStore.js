import { useState, useEffect } from 'react'

const KEY = 'sprintai_schedule_events'

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function useScheduleStore() {
  const [events, setEvents] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(events)) } catch {}
  }, [events])

  function addEvent(date, title) {
    if (!title?.trim()) return
    setEvents(prev => [...prev, { id: Date.now(), date, title: title.trim() }])
  }

  function removeEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return { events, addEvent, removeEvent }
}
