import { useState, useEffect } from 'react'

const KEY = 'sprintai_plan_selection'

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { return new Set() }
}
function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify([...s])) } catch {}
}

export function useSprintPlanStore() {
  const [selected, setSelected] = useState(load)
  useEffect(() => { save(selected) }, [selected])

  function toggle(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function remove(id) {
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  function clear() { setSelected(new Set()) }

  return { selected, toggle, remove, clear }
}
