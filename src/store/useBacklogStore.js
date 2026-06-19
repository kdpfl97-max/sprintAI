import { useState, useEffect } from 'react'

const STORAGE_KEY = 'sprintai_backlog'

const DEFAULT_ITEMS = [
  { id: 1, title: '소셜 로그인 (구글)',    category: '기능', priority: 'Must',   stage: 'MVP',  points: 5,  desc: '구글 OAuth 2.0 연동 로그인' },
  { id: 2, title: '팀 생성 및 초대',       category: '에픽', priority: 'Must',   stage: 'MVP',  points: 8,  desc: '팀 워크스페이스 생성, 이메일 초대' },
  { id: 3, title: '백로그 CRUD',           category: '기능', priority: 'Must',   stage: 'MVP',  points: 8,  desc: '에픽/태스크 생성·수정·삭제·정렬' },
  { id: 4, title: 'AI 스프린트 빌더',      category: '기능', priority: 'Must',   stage: 'MVP',  points: 13, desc: '백로그 → AI 스프린트 자동 구성' },
  { id: 5, title: 'Capacity 입력',         category: '기능', priority: 'Must',   stage: 'MVP',  points: 5,  desc: '팀원별 스프린트 가용 시간 입력' },
  { id: 6, title: '칸반 보드',             category: '기능', priority: 'Must',   stage: 'MVP',  points: 8,  desc: 'To Do / In Progress / Done' },
  { id: 7, title: 'AI 태스크 분해기',      category: '기능', priority: 'Must',   stage: 'MVP',  points: 8,  desc: '에픽 → 스토리 → 태스크 자동 분해' },
  { id: 8, title: '스프린트 대시보드',     category: '기능', priority: 'Should', stage: 'MVP',  points: 8,  desc: '스프린트 진행 현황 한눈에 보기' },
  { id: 9, title: '슬랙 연동',             category: '기능', priority: 'Should', stage: 'v1.0', points: 8,  desc: '스프린트 알림, 태스크 상태 업데이트' },
  { id:10, title: '회고 리포트 AI 생성',   category: '기능', priority: 'Should', stage: 'v1.0', points: 8,  desc: 'AI 자동 스프린트 회고 생성' },
  { id:11, title: '노션 연동',             category: '기능', priority: 'Should', stage: 'v1.0', points: 5,  desc: '스프린트 보드 노션 자동 동기화' },
  { id:12, title: '팀원 workload 히트맵',  category: '기능', priority: 'Could',  stage: 'v1.0', points: 5,  desc: '팀원별 업무 부하 시각화' },
  { id:13, title: 'GitHub 이슈 연동',      category: '기능', priority: 'Could',  stage: 'v2.0', points: 8,  desc: 'GitHub 이슈 → 백로그 자동 가져오기' },
  { id:14, title: '모바일 앱 (iOS)',       category: '기능', priority: 'Could',  stage: 'v2.0', points: 21, desc: 'iOS 네이티브 앱' },
  { id:15, title: 'AI PM 코치',            category: '기능', priority: 'Could',  stage: 'v2.0', points: 13, desc: '스프린트 개선 조언 AI 코치' },
]

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_ITEMS
  } catch {
    return DEFAULT_ITEMS
  }
}

function save(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

export function useBacklogStore() {
  const [items, setItems] = useState(load)

  useEffect(() => { save(items) }, [items])

  const add = (item) =>
    setItems(prev => [...prev, { ...item, id: Date.now(), points: Number(item.points) || 0 }])

  const update = (id, patch) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch, points: Number(patch.points ?? i.points) } : i))

  const remove = (id) =>
    setItems(prev => prev.filter(i => i.id !== id))

  return { items, add, update, remove }
}
