import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sprintai_team'

const DEFAULT_MEMBERS = [
  { id: 'm0', name: '곽예리', role: 'PM',        email: 'yeri@team.io',    color: '#2563EB', initials: '곽', capacity: 80, status: 'active' },
  { id: 'm1', name: '박준혁', role: '백엔드',    email: 'junhyuk@team.io',  color: '#2E75B6', initials: '박', capacity: 80, status: 'active' },
  { id: 'm2', name: '김서연', role: '프론트엔드', email: 'seoyeon@team.io', color: '#22C55E', initials: '김', capacity: 80, status: 'active' },
  { id: 'm3', name: '이민수', role: 'AI/백엔드',  email: 'minsu@team.io',   color: '#8B5CF6', initials: '이', capacity: 80, status: 'active' },
  { id: 'm4', name: '최지은', role: '디자인',     email: 'jieun@team.io',   color: '#F59E0B', initials: '최', capacity: 80, status: 'active' },
]

const ROLE_OPTIONS = ['프론트엔드', '백엔드', 'AI/백엔드', '풀스택', '디자인', 'PM', 'DevOps', 'QA']
const COLOR_OPTIONS = [
  '#2E75B6', '#22C55E', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#F97316',
]

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MEMBERS
    const parsed = JSON.parse(raw)
    // PM 멤버가 없으면 기본값으로 리셋
    if (!parsed.some(m => m.role === 'PM')) return DEFAULT_MEMBERS
    return parsed
  } catch { return DEFAULT_MEMBERS }
}

function save(members) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(members)) } catch {}
}

export { ROLE_OPTIONS, COLOR_OPTIONS }

export function useTeamStore() {
  const [members, setMembers] = useState(load)

  useEffect(() => { save(members) }, [members])

  function addMember(data) {
    const initials = data.name.slice(0, 1)
    const newMember = {
      id: `m${Date.now()}`,
      ...data,
      initials,
      status: 'active',
    }
    setMembers(prev => [...prev, newMember])
  }

  function updateMember(id, data) {
    setMembers(prev => prev.map(m =>
      m.id === id ? { ...m, ...data, initials: data.name?.slice(0, 1) ?? m.initials } : m
    ))
  }

  function removeMember(id) {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  return { members, addMember, updateMember, removeMember }
}
