import { useState, useEffect } from 'react'

const KEY = 'sprintai_notifications'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function useNotificationStore() {
  const [notifications, setNotifications] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(notifications)) } catch {}
  }, [notifications])

  function push(n) {
    setNotifications(prev =>
      [{ ...n, id: Date.now(), createdAt: new Date().toISOString(), read: false }, ...prev].slice(0, 50)
    )
  }

  function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function clear() { setNotifications([]) }

  const unread = notifications.filter(n => !n.read).length

  return { notifications, push, markRead, markAllRead, clear, unread }
}
