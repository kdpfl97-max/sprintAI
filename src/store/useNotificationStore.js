import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ensureTeamId } from '../lib/team'

function toNotif(row) {
  return { id: row.id, type: row.type, title: row.title, body: row.body, read: row.read, createdAt: row.created_at }
}

export function useNotificationStore() {
  const [teamId, setTeamId] = useState(null)
  const [notifications, setNotifications] = useState([])

  const reload = useCallback(async (tid) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('team_id', tid)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications((data || []).map(toNotif))
  }, [])

  useEffect(() => {
    let channel
    ensureTeamId().then((tid) => {
      setTeamId(tid)
      reload(tid)
      // 채널명에 랜덤 suffix — 같은 훅을 여러 컴포넌트가 동시에 마운트해도 채널 이름이 겹치지 않게 함
      channel = supabase
        .channel(`notifications-${tid}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `team_id=eq.${tid}` },
          () => reload(tid))
        .subscribe()
    })
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [reload])

  async function push(n) {
    if (!teamId) return
    await supabase.from('notifications').insert({ team_id: teamId, type: n.type, title: n.title, body: n.body })
    await reload(teamId)
  }

  async function markRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (teamId) await supabase.from('notifications').update({ read: true }).eq('team_id', teamId).eq('read', false)
  }

  async function clear() {
    setNotifications([])
    if (teamId) await supabase.from('notifications').delete().eq('team_id', teamId)
  }

  function resetDemo() { /* ponytail: 실서비스 전환 후 더미 리셋 불필요 — no-op */ }

  const unread = notifications.filter(n => !n.read).length

  return { notifications, push, markRead, markAllRead, clear, resetDemo, unread }
}
