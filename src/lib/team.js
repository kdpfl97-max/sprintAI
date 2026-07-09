import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const TEAM_ID_KEY = 'sprintai_team_id'
const TEAM_CODE_KEY = 'sprintai_team_code'

function generateCode() {
  return 'SPR-' + Math.random().toString(36).substring(2, 6).toUpperCase()
}

let pending = null

// ponytail: 아직 로그인이 없어서 "이 브라우저 = 이 팀"으로 고정.
// 실제 인증 붙이면 team_members(user_id=auth.uid())로 소속 팀을 찾도록 교체.
export function ensureTeamId() {
  if (pending) return pending
  pending = (async () => {
    const savedId = localStorage.getItem(TEAM_ID_KEY)
    if (savedId) {
      const { data } = await supabase.from('teams').select('id').eq('id', savedId).maybeSingle()
      if (data) return data.id
    }
    const code = localStorage.getItem(TEAM_CODE_KEY) || generateCode()
    const { data: existing } = await supabase.from('teams').select('id').eq('team_code', code).maybeSingle()
    let id = existing?.id
    if (!id) {
      const { data: created, error } = await supabase
        .from('teams')
        .insert({ name: '내 팀', team_code: code })
        .select('id')
        .single()
      if (error) throw error
      id = created.id
    }
    localStorage.setItem(TEAM_ID_KEY, id)
    localStorage.setItem(TEAM_CODE_KEY, code)
    return id
  })()
  return pending
}

export function useTeamId() {
  const [teamId, setTeamId] = useState(null)
  useEffect(() => { ensureTeamId().then(setTeamId) }, [])
  return teamId
}
