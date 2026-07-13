import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { seedDemoDataIfEmpty } from './seedDemoData'

const TEAM_ID_KEY = 'sprintai_team_id'
const TEAM_CODE_KEY = 'sprintai_team_code'

function generateCode() {
  return 'SPR-' + Math.random().toString(36).substring(2, 6).toUpperCase()
}

let pending = null

// ponytail: 아직 로그인이 없어서 팀을 브라우저별로 구분할 방법이 없다.
// 아직 멀티테넌트도 아니므로 "이미 있는 팀이 있으면 그걸 쓰고, 없으면 새로 만든다"로 단일 팀 취급.
// 실제 인증 붙이면 team_members(user_id=auth.uid())로 소속 팀을 찾도록 교체.
export function ensureTeamId() {
  if (pending) return pending
  pending = (async () => {
    let id = null

    const savedId = localStorage.getItem(TEAM_ID_KEY)
    if (savedId) {
      const { data } = await supabase.from('teams').select('id').eq('id', savedId).maybeSingle()
      if (data) id = data.id
    }

    if (!id) {
      const { data: anyTeam } = await supabase
        .from('teams').select('id, team_code').order('created_at', { ascending: true }).limit(1).maybeSingle()
      if (anyTeam) {
        id = anyTeam.id
        localStorage.setItem(TEAM_ID_KEY, anyTeam.id)
        localStorage.setItem(TEAM_CODE_KEY, anyTeam.team_code)
      }
    }

    if (!id) {
      const code = generateCode()
      const { data: created, error } = await supabase
        .from('teams')
        .insert({ name: '내 팀', team_code: code })
        .select('id')
        .single()
      if (error) throw error
      id = created.id
      localStorage.setItem(TEAM_ID_KEY, id)
      localStorage.setItem(TEAM_CODE_KEY, code)
    }

    // 실무자 데모용 — 팀이 비어있으면(초기화됐거나 막 생성됐거나) 항상 같은 더미데이터로 채움
    await seedDemoDataIfEmpty(id)
    return id
  })()
  return pending
}

export function useTeamId() {
  const [teamId, setTeamId] = useState(null)
  useEffect(() => { ensureTeamId().then(setTeamId) }, [])
  return teamId
}
