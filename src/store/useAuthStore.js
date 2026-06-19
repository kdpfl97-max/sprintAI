import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sprintai_current_user'

// PM 역할만 민감 액션 허용
const PM_ROLES = ['PM']

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function save(user) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function useAuthStore() {
  const [currentUser, setCurrentUser] = useState(load)

  useEffect(() => { save(currentUser) }, [currentUser])

  function login(member) { setCurrentUser(member) }
  function logout()      { setCurrentUser(null) }

  const isPM = currentUser ? PM_ROLES.includes(currentUser.role) : false

  // AI 스프린트 빌더 권한 체크
  const can = {
    runAI:          isPM,
    confirmSprint:  isPM,
    assignMember:   isPM,
    deleteSprint:   isPM,
  }

  return { currentUser, login, logout, isPM, can }
}
