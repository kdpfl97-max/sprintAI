import { useState, useEffect } from 'react'

const KEY = 'sprintai_notifications'

function ago(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

const SEED = [
  {
    id: 1,
    icon: '🚨',
    title: '블로커 감지 — 소셜 로그인 구현',
    body: '담당자 미배정 상태로 3일째 대기 중입니다. 스프린트 마감까지 4일 남았습니다.',
    read: false,
    createdAt: ago(12),
  },
  {
    id: 2,
    icon: '✅',
    title: '태스크 완료 — 메인 대시보드 UI',
    body: '곽예리님이 "메인 대시보드 UI 구현"을 완료로 변경했습니다.',
    read: false,
    createdAt: ago(37),
  },
  {
    id: 3,
    icon: '📢',
    title: 'PM 공지 — 스프린트 리뷰 일정 변경',
    body: '스프린트 리뷰가 금요일 오후 2시 → 오후 4시로 변경되었습니다.',
    read: false,
    createdAt: ago(95),
  },
  {
    id: 4,
    icon: '⚠️',
    title: '마감 임박 — 프론트엔드 UI',
    body: '"전체 할 일 CRUD — 프론트엔드 UI" 마감까지 1일 남았습니다.',
    read: true,
    createdAt: ago(180),
  },
  {
    id: 5,
    icon: '💬',
    title: '댓글 — Capacity 입력 화면',
    body: '이준호님: "API 연동 방식 먼저 논의 필요합니다. 내일 오전에 시간 되세요?"',
    read: true,
    createdAt: ago(320),
  },
  {
    id: 6,
    icon: '🔄',
    title: '태스크 상태 변경 — 소셜 로그인 구현',
    body: '김민준님이 상태를 "예정" → "진행 중"으로 변경했습니다.',
    read: true,
    createdAt: ago(600),
  },
  {
    id: 7,
    icon: '🎉',
    title: 'Sprint 1 목표 달성률 23%',
    body: '현재 5/16개 완료. AI 추천: 블로커 해소 시 달성률 50% 이상 가능합니다.',
    read: true,
    createdAt: ago(1440),
  },
]

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    // 저장된 데이터가 없으면 더미 시드 반환
    if (!Array.isArray(saved) || saved.length === 0) return SEED
    return saved
  } catch {
    return SEED
  }
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

  // 더미 데이터 리셋 (포트폴리오 데모용)
  function resetDemo() { setNotifications(SEED) }

  const unread = notifications.filter(n => !n.read).length

  return { notifications, push, markRead, markAllRead, clear, resetDemo, unread }
}
