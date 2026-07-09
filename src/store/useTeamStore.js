import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ensureTeamId } from '../lib/team'

const ROLE_OPTIONS = ['프론트엔드', '백엔드', 'AI/백엔드', '풀스택', '디자인', '마케터', 'PM', 'DevOps', 'QA']
const COLOR_OPTIONS = [
  '#2E75B6', '#22C55E', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#F97316',
]

export { ROLE_OPTIONS, COLOR_OPTIONS }

function generateCode() {
  return 'SPR-' + Math.random().toString(36).substring(2, 6).toUpperCase()
}

function toMember(row) {
  return {
    id: row.id,
    name: row.profiles.name,
    role: row.job_role,
    email: row.profiles.email || '',
    color: row.profiles.color,
    initials: row.profiles.initials,
    capacity: row.capacity,
    status: row.status,
  }
}

const SELECT = 'id, job_role, capacity, status, profiles(name, color, initials, email)'

export function useTeamStore() {
  const [teamId, setTeamId] = useState(null)
  const [members, setMembers] = useState([])
  const [settings, setSettings] = useState({ teamCode: '', discordWebhook: '' })

  const reload = useCallback(async (tid) => {
    const [{ data: rows }, { data: team }] = await Promise.all([
      supabase.from('team_members').select(SELECT).eq('team_id', tid),
      supabase.from('teams').select('team_code, discord_webhook').eq('id', tid).single(),
    ])
    setMembers((rows || []).map(toMember))
    if (team) setSettings({ teamCode: team.team_code, discordWebhook: team.discord_webhook || '' })
  }, [])

  useEffect(() => {
    ensureTeamId().then(async (tid) => {
      setTeamId(tid)
      await reload(tid)
    })
  }, [reload])

  async function addMember(data) {
    const initials = data.name.slice(0, 1)
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .insert({ name: data.name, color: data.color, initials, email: data.email || null })
      .select('id')
      .single()
    if (pErr) throw pErr
    const { error: mErr } = await supabase.from('team_members').insert({
      team_id: teamId,
      user_id: profile.id,
      role: data.role === 'PM' ? 'PM' : 'member',
      job_role: data.role,
      capacity: data.capacity ?? 80,
      status: 'active',
    })
    if (mErr) throw mErr
    await reload(teamId)
  }

  async function updateMember(id, data) {
    const member = members.find(m => m.id === id)
    if (!member) return
    const patch = {}
    if (data.role !== undefined) patch.job_role = data.role
    if (data.capacity !== undefined) patch.capacity = data.capacity
    if (data.status !== undefined) patch.status = data.status
    if (Object.keys(patch).length) {
      await supabase.from('team_members').update(patch).eq('id', id)
    }
    const profilePatch = {}
    if (data.name !== undefined) { profilePatch.name = data.name; profilePatch.initials = data.name.slice(0, 1) }
    if (data.color !== undefined) profilePatch.color = data.color
    if (data.email !== undefined) profilePatch.email = data.email
    if (Object.keys(profilePatch).length) {
      const { data: mRow } = await supabase.from('team_members').select('user_id').eq('id', id).single()
      if (mRow) await supabase.from('profiles').update(profilePatch).eq('id', mRow.user_id)
    }
    await reload(teamId)
  }

  async function removeMember(id) {
    await supabase.from('team_members').delete().eq('id', id)
    await reload(teamId)
  }

  async function regenerateCode() {
    const teamCode = generateCode()
    await supabase.from('teams').update({ team_code: teamCode }).eq('id', teamId)
    localStorage.setItem('sprintai_team_code', teamCode)
    setSettings(s => ({ ...s, teamCode }))
  }

  async function setDiscordWebhook(url) {
    await supabase.from('teams').update({ discord_webhook: url }).eq('id', teamId)
    setSettings(s => ({ ...s, discordWebhook: url }))
  }

  // 팀 코드로 팀 참여 (이름+역할 입력 → 멤버 추가 + 반환)
  async function joinWithCode(code, name, role, color) {
    if (code !== settings.teamCode) return null
    const existing = members.find(m => m.name === name)
    if (existing) return existing
    await addMember({ name, role, color: color || '#2563EB', capacity: 80, email: '' })
    const { data: rows } = await supabase.from('team_members').select(SELECT).eq('team_id', teamId)
    return (rows || []).map(toMember).find(m => m.name === name) || null
  }

  return { members, addMember, updateMember, removeMember, settings, regenerateCode, setDiscordWebhook, joinWithCode }
}
