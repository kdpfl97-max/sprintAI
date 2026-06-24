import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { useBacklogStore } from '../store/useBacklogStore'

const CAPACITY = {
  '박준혁': { used: 48, total: 64, color: '#2563EB' },
  '김서연': { used: 28, total: 60, color: '#22C55E' },
  '이민수': { used: 12, total: 48, color: '#8B5CF6' },
  '최지은': { used: 26, total: 40, color: '#F59E0B' },
}

const card = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E8EAED',
  boxShadow: '0 1px 2px rgba(17,24,39,0.04)',
}

function MetricCard({ label, value, unit, sub, subColor, accent }) {
  return (
    <div style={{ ...card, padding: '20px 22px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 3 }}>
        {value}
        {unit && <span style={{ fontSize: 16, fontWeight: 500, color: '#9CA3AF' }}>{unit}</span>}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: subColor || '#9CA3AF', marginTop: 6, fontWeight: 500 }}>{sub}</div>
      )}
      {accent && (
        <div style={{ height: 3, background: accent, borderRadius: 2, marginTop: 14, width: '40%' }} />
      )}
    </div>
  )
}

function BurndownChart({ tasks }) {
  const totalSP = tasks.reduce((s, t) => s + (t.points || 0), 0)
  return (
    <svg viewBox="0 0 500 160" style={{ width: '100%', height: 160 }}>
      <defs>
        <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#F3F4F6" strokeWidth="1"/>
        </pattern>
        <linearGradient id="bluefill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <rect width="500" height="160" fill="url(#grid)"/>
      <line x1="30" y1="15" x2="470" y2="145" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="5,3"/>
      <polyline points="30,15 80,18 130,25 180,42 230,55 280,75 330,85"
        fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round"/>
      <polyline points="330,85 380,105 430,125 470,145"
        fill="none" stroke="#2563EB" strokeWidth="2" strokeDasharray="4,3" opacity="0.4"/>
      <path d="M30,15 80,18 130,25 180,42 230,55 280,75 330,85 330,160 30,160Z"
        fill="url(#bluefill)"/>
      <circle cx="330" cy="85" r="5" fill="#2563EB" stroke="white" strokeWidth="2"/>
      <text x="30"  y="155" fontSize="10" fill="#9CA3AF">D+0</text>
      <text x="130" y="155" fontSize="10" fill="#9CA3AF">D+3</text>
      <text x="230" y="155" fontSize="10" fill="#9CA3AF">D+6</text>
      <text x="305" y="155" fontSize="10" fill="#2563EB" fontWeight="bold">D+8 (오늘)</text>
      <text x="430" y="155" fontSize="10" fill="#9CA3AF">D+14</text>
      <text x="35"  y="15"  fontSize="10" fill="#9CA3AF">{totalSP}작업량</text>
      <text x="35"  y="150" fontSize="10" fill="#9CA3AF">0</text>
      <line x1="360" y1="12" x2="380" y2="12" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="384" y="16" fontSize="10" fill="#9CA3AF">이상적</text>
      <line x1="420" y1="12" x2="440" y2="12" stroke="#2563EB" strokeWidth="2"/>
      <text x="444" y="16" fontSize="10" fill="#2563EB">실제</text>
    </svg>
  )
}

function DashCard({ title, right, children }) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
        {right && <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{right}</span>}
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  )
}

function Avatar({ initials, color, size = 24, fontSize = 10 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function SpChip({ points }) {
  return (
    <span style={{
      background: '#F3F4F6', color: '#6B7280',
      fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 9999,
    }}>
      {points}작업량
    </span>
  )
}

const STATUS_DOT = {
  done:       '#10B981',
  inprogress: '#2563EB',
  todo:       '#D1D5DB',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { sprint, closeSprint } = useSprintStore()
  const { currentUser, can } = useAuthStore()
  const { add: addToBacklog } = useBacklogStore()
  const tasks = sprint.tasks
  const [showMyOnly,    setShowMyOnly]    = useState(false)
  const [showBlockers,  setShowBlockers]  = useState(false)
  const [closeModal,    setCloseModal]    = useState(false)

  function handleClose() {
    const incomplete = closeSprint()
    // 미완료 태스크 → 백로그 이월
    incomplete.forEach(t => addToBacklog({
      title: t.title, priority: t.priority, points: t.points,
      desc: `[${sprint.name}에서 이월]`, category: '기능', stage: 'MVP',
    }, currentUser?.id || null))
    setCloseModal(false)
    navigate('/retro')
  }

  const done       = tasks.filter(t => t.status === 'done')
  const inprogress = tasks.filter(t => t.status === 'inprogress')
  const todo       = tasks.filter(t => t.status === 'todo')

  const totalSP = tasks.reduce((s, t) => s + (t.points || 0), 0)
  const doneSP  = done.reduce((s, t) => s + (t.points || 0), 0)
  const pct     = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0

  const [ey, em, ed] = sprint.endDate.replace(/-/g, '.').split('.')
  const endDate  = new Date(Number(ey), Number(em) - 1, Number(ed))
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((endDate - today) / 86400000)
  const daysLabel = daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : '종료'

  const memberMap = {}
  tasks.forEach(t => {
    if (!t.member) return
    const k = t.member.name
    if (!memberMap[k]) memberMap[k] = { member: t.member, tasks: [] }
    memberMap[k].tasks.push(t)
  })
  const members = Object.values(memberMap)

  const bigTodoTask = todo.find(t => t.points >= 13)

  const insights = [
    done.length >= 3 && {
      icon: '✅',
      title: '인증 기반 완성 — 순조로운 출발',
      desc: `로그인·팀 기반 ${done.length}개 태스크 완료. 현재 페이스면 AI 기능 개발 일정에 여유가 생깁니다.`,
      border: '#A7F3D0', bg: '#F0FDF4',
    },
    bigTodoTask && {
      icon: '⚠️',
      title: `${bigTodoTask.member?.name}님 대형 태스크 주의`,
      desc: `"${bigTodoTask.title}"(${bigTodoTask.points}작업량)이 아직 시작 전이에요. 이번 주 착수가 필요합니다.`,
      border: '#FDE68A', bg: '#FFFBEB',
    },
    {
      icon: '💡',
      title: '다음 스프린트 예측',
      desc: `현재 velocity 기준, Sprint 2에서 나머지 ${todo.length}개(${todo.reduce((s, t) => s + t.points, 0)}작업량) 완료 가능해 보여요.`,
      border: '#DDD6FE', bg: '#F5F3FF',
    },
  ].filter(Boolean)

  // 내 현황
  const myTasks     = currentUser ? tasks.filter(t => t.member?.name === currentUser.name) : []
  const myDone      = myTasks.filter(t => t.status === 'done')
  const myInpro     = myTasks.filter(t => t.status === 'inprogress')
  const myDoneSP    = myDone.reduce((s, t) => s + (t.points || 0), 0)
  const myTotalSP   = myTasks.reduce((s, t) => s + (t.points || 0), 0)
  const myPct       = myTotalSP > 0 ? Math.round((myDoneSP / myTotalSP) * 100) : 0
  const contribution = totalSP > 0 ? Math.round((myDoneSP / doneSP) * 100) || 0 : 0

  // 블로커: inprogress인데 progress가 0인 태스크
  const blockers = inprogress.filter(t => t.progress === 0)

  // 번다운 예측: 스프린트 전체 14일, 오늘 기준 경과일 계산
  const [sy, sm, sd] = sprint.startDate.split('.')
  const startDate  = new Date(Number(sy), Number(sm) - 1, Number(sd))
  const totalDays  = 14
  const elapsedDays = Math.max(1, Math.round((today - startDate) / 86400000))
  const remainSP   = totalSP - doneSP
  const idealRemain = Math.round(totalSP * (1 - elapsedDays / totalDays))
  const burnGap    = remainSP - idealRemain // 양수 = 뒤처짐
  const predictedEndSP = remainSP - (doneSP / elapsedDays) * (totalDays - elapsedDays)
  const onTrack    = predictedEndSP <= 0

  // 신호등
  const signal = blockers.length >= 2 || burnGap > 10 ? 'danger'
    : blockers.length >= 1 || burnGap > 0 ? 'warn'
    : 'safe'
  const SIGNAL = {
    safe:   { label: '순조로움', color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0' },
    warn:   { label: '주의',     color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    danger: { label: '위험',     color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  }[signal]

  // 팀원별 남은 SP (workload)
  const workload = Object.values(memberMap).map(({ member, tasks: mt }) => ({
    member,
    remainSP: mt.filter(t => t.status !== 'done').reduce((s, t) => s + (t.points || 0), 0),
    doneSP:   mt.filter(t => t.status === 'done').reduce((s, t) => s + (t.points || 0), 0),
  })).sort((a, b) => b.remainSP - a.remainSP)
  const maxRemain = Math.max(...workload.map(w => w.remainSP), 1)

  const sortedAll  = [...inprogress, ...todo, ...done]
  const sortedMy   = [...myInpro, ...myTasks.filter(t => t.status === 'todo'), ...myDone]
  const sortedTasks = showMyOnly ? sortedMy : sortedAll

  const isOverdue   = daysLeft < 0 && sprint.status !== 'completed'
  const isDDay      = daysLeft === 0 && sprint.status !== 'completed'
  const incomplete  = tasks.filter(t => t.status !== 'done')

  // 데이터 기반 AI 인사이트 패널용
  const aiInsights = (() => {
    const list = []
    const overloaded = workload.filter(w => w.remainSP > 15)
    const heaviest   = workload[0]

    if (signal === 'danger') {
      list.push({ level: 'danger', icon: '🚨', text: `마감까지 ${daysLeft > 0 ? `${daysLeft}일` : '시간이 없는데'} 완료율이 ${pct}%입니다. 즉각적인 재조정이 필요해요.` })
    } else if (signal === 'warn') {
      list.push({ level: 'warn', icon: '⚠️', text: `번다운이 이상 대비 ${burnGap}작업량 뒤처져 있어요. 이번 주 집중이 필요합니다.` })
    } else {
      list.push({ level: 'safe', icon: '✅', text: `현재 속도라면 마감 내 완료 가능해요. 좋은 페이스입니다.` })
    }

    if (blockers.length > 0) {
      const names = blockers.map(t => t.member?.name).filter(Boolean).join(', ')
      list.push({ level: 'warn', icon: '🔴', text: `${blockers.length}개 태스크가 블로커 상태예요. ${names ? `${names}님 확인이 필요합니다.` : ''}` })
    }

    if (overloaded.length > 0) {
      list.push({ level: 'warn', icon: '⚡', text: `${overloaded.map(w => w.member.name).join(', ')}님의 남은 작업량이 과중합니다. 재배분을 검토해보세요.` })
    } else if (heaviest && heaviest.remainSP > 0) {
      list.push({ level: 'info', icon: '📊', text: `${heaviest.member.name}님이 ${heaviest.remainSP}작업량으로 가장 많은 작업을 갖고 있어요.` })
    }

    if (pct >= 80) {
      list.push({ level: 'safe', icon: '🎯', text: `완료율 ${pct}% — 스프린트 마무리 단계입니다. 회고를 준비해보세요.` })
    } else if (todo.length > inprogress.length * 2) {
      list.push({ level: 'info', icon: '📋', text: `대기 중인 태스크(${todo.length}개)가 진행 중(${inprogress.length}개)보다 많아요. 착수를 서두르세요.` })
    }

    return list
  })()

  // 진행 중 스프린트 없을 때 Empty State
  if (!sprint?.status || sprint.status === 'completed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Topbar title="대시보드" subtitle="진행 중인 스프린트 없음" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#F4F5F7' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📊</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>진행 중인 스프린트가 없어요</p>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              {sprint?.status === 'completed' ? '스프린트가 종료됐습니다. 회고 후 새 스프린트를 시작해보세요.' : 'AI 스프린트 빌더에서 스프린트를 만들어보세요.'}
            </p>
          </div>
          <a href={sprint?.status === 'completed' ? '/retro' : '/sprint/builder'} style={{
            padding: '0 20px', height: 40, borderRadius: 12, background: '#2563EB', color: '#fff',
            fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center',
          }}>
            {sprint?.status === 'completed' ? '회고 시작하기' : 'AI 스프린트 빌더로 이동'}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 종료 확인 모달 */}
      {closeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setCloseModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 60px rgba(17,24,39,0.2)' }}>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>스프린트를 종료할까요?</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 6 }}>{sprint.name}</p>
            </div>
            {incomplete.length > 0 ? (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 8 }}>
                  ⚠️ 미완료 태스크 {incomplete.length}개가 백로그로 이월됩니다
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {incomplete.map(t => (
                    <div key={t.id} style={{ fontSize: 12, color: '#78350F', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706', flexShrink: 0, display: 'inline-block' }} />
                      {t.title} · {t.points}작업량
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#065F46' }}>
                ✓ 모든 태스크가 완료됐어요!
              </div>
            )}
            <p style={{ fontSize: 13, color: '#6B7280' }}>종료 후 회고 페이지로 이동합니다.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setCloseModal(false)} style={{ padding: '0 18px', height: 38, borderRadius: 10, border: '1px solid #E8EAED', background: '#F4F5F7', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleClose} style={{ padding: '0 18px', height: 38, borderRadius: 10, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                종료 및 회고 시작
              </button>
            </div>
          </div>
        </div>
      )}

      <Topbar title="대시보드" subtitle={`${sprint.name} · 실시간`}>
        {can.confirmSprint && sprint.status !== 'completed' && (
          <button onClick={() => setCloseModal(true)} style={{
            padding: '0 16px', height: 36, borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer',
          }}>
            스프린트 종료
          </button>
        )}
      </Topbar>

      {/* 종료 필요 배너 */}
      {(isOverdue || isDDay) && (
        <div style={{
          background: isOverdue ? '#FEF2F2' : '#FFFBEB',
          borderBottom: `1px solid ${isOverdue ? '#FECACA' : '#FDE68A'}`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>{isOverdue ? '🚨' : '⏰'}</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: isOverdue ? '#DC2626' : '#B45309' }}>
                {isOverdue ? `스프린트 종료일이 ${Math.abs(daysLeft)}일 지났습니다` : '오늘이 스프린트 마지막 날입니다'}
              </span>
              <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 8 }}>
                미완료 태스크 {incomplete.length}개 · 완료율 {pct}%
              </span>
            </div>
          </div>
          {can.confirmSprint && (
            <button onClick={() => setCloseModal(true)} style={{
              padding: '0 16px', height: 34, borderRadius: 9999, fontSize: 12, fontWeight: 700,
              background: isOverdue ? '#DC2626' : '#D97706', color: '#fff', border: 'none', cursor: 'pointer',
            }}>
              지금 종료하기
            </button>
          )}
        </div>
      )}

      <div style={{
        flex: 1, overflowY: 'auto', background: '#F9FAFB',
        padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* 내 현황 — 로그인한 팀원에게만 표시 */}
        {currentUser && (
          <div style={{ ...card, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={currentUser.initials} color={currentUser.color} size={32} fontSize={13} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{currentUser.name}님의 현황</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{currentUser.role}</div>
                </div>
              </div>
              {blockers.length > 0 && (
                <button onClick={() => setShowBlockers(p => !p)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 13 }}>⚠️</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>블로커 {blockers.length}개 감지</span>
                  <span style={{ fontSize: 11, color: '#92400E' }}>{showBlockers ? '▲' : '▼'}</span>
                </button>
              )}
            </div>
            {showBlockers && blockers.length > 0 && (
              <div style={{ marginBottom: 16, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #FDE68A', fontSize: 12, fontWeight: 700, color: '#92400E' }}>
                  진행 시작 전 태스크 — 확인 필요
                </div>
                {blockers.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #FEF9C3' }}>
                    <Avatar initials={t.member?.initials} color={t.member?.color || '#9CA3AF'} size={24} fontSize={10} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{t.member?.name} · {t.points}작업량 · inprogress 상태이나 진행률 0%</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#DC2626', padding: '2px 8px', borderRadius: 9999 }}>블로커</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 }}>내 태스크</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{myTasks.length}<span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>개</span></div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 }}>진행 중</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB' }}>{myInpro.length}<span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>개</span></div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 }}>내 완료율</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981' }}>{myPct}<span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>%</span></div>
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 }}>팀 기여도</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#8B5CF6' }}>{doneSP > 0 ? contribution : '-'}<span style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF' }}>{doneSP > 0 ? '%' : ''}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* 핵심 지표 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <MetricCard label="완료율"              value={pct}       unit="%" sub="목표 대비 순조로움" subColor="#10B981" accent="#10B981" />
          <MetricCard label="완료 작업량"          value={doneSP}    unit={`/${totalSP}`} sub={`남은 작업량 ${totalSP - doneSP}`} accent="#2563EB" />
          <MetricCard label="팀 Capacity 소진"   value={64}         unit="%" sub="과부하 없음" subColor="#10B981" accent="#8B5CF6" />
          <MetricCard label="D-Day"              value={daysLabel}  sub={sprint.endDate + ' 종료'} subColor={daysLeft <= 3 ? '#EF4444' : '#9CA3AF'} accent={daysLeft <= 3 ? '#EF4444' : '#F59E0B'} />
        </div>

        {/* AI 인사이트 */}
        <div style={{ ...card, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>AI 인사이트</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {aiInsights.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10,
                background: item.level === 'danger' ? '#FEF2F2'
                          : item.level === 'warn'   ? '#FFFBEB'
                          : item.level === 'safe'   ? '#F0FDF4'
                          : '#F4F5F7',
                border: `1px solid ${
                  item.level === 'danger' ? '#FECACA'
                : item.level === 'warn'   ? '#FDE68A'
                : item.level === 'safe'   ? '#A7F3D0'
                : '#E8EAED'}`,
              }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 리스크 관리 — PM 시점 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

          {/* 신호등 + 번다운 예측 */}
          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>스프린트 상태</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: SIGNAL.color, flexShrink: 0 }} />
              <span style={{ fontSize: 20, fontWeight: 800, color: SIGNAL.color }}>{SIGNAL.label}</span>
            </div>
            <div style={{ background: SIGNAL.bg, border: `1px solid ${SIGNAL.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                {onTrack
                  ? `현재 속도면 마감일 내 완료 가능`
                  : `이 속도면 마감 시 약 ${Math.ceil(predictedEndSP)}작업량 잔여 예상`}
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                이상 대비 {burnGap > 0 ? `${burnGap}작업량 뒤처짐` : `${Math.abs(burnGap)}작업량 앞서감`}
              </div>
            </div>
          </div>

          {/* 블로커 상세 */}
          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>블로커 & 의존성</div>
            {blockers.length === 0 ? (
              <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>✓ 블로커 없음</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {blockers.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
                    <Avatar initials={t.member?.initials} color={t.member?.color || '#9CA3AF'} size={22} fontSize={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{t.member?.name} · {t.points}작업량 · 진행률 0%</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: 9999, flexShrink: 0 }}>블로커</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workload 재배분 힌트 */}
          <div style={{ ...card, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 }}>팀원별 남은 작업량</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workload.map(({ member, remainSP: rSP, doneSP: dSP }) => (
                <div key={member.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#111827' }}>
                      <Avatar initials={member.initials} color={member.color} size={20} fontSize={8} />
                      {member.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                      <span style={{ color: '#10B981', fontWeight: 600 }}>{dSP}작업량 완료</span>
                      {rSP > 0 && <span> · 잔여 {rSP}작업량</span>}
                    </div>
                  </div>
                  <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ height: '100%', width: `${Math.round((rSP / maxRemain) * 100)}%`, background: rSP > 15 ? '#EF4444' : rSP > 8 ? '#F59E0B' : '#10B981', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
              {workload.some(w => w.remainSP > 15) && (
                <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 600, marginTop: 4 }}>
                  ⚠️ 재배분 검토 필요
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 번다운 + Capacity */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <DashCard title="번다운 차트" right="이상적 대비 실제 진행">
            <BurndownChart tasks={tasks} />
          </DashCard>

          <DashCard title="팀원 Capacity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {members.map(({ member }) => {
                const cap = CAPACITY[member.name] || { used: 0, total: 40, color: member.color }
                const p   = Math.round((cap.used / cap.total) * 100)
                return (
                  <div key={member.name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                        <Avatar initials={member.initials} color={cap.color} size={24} fontSize={10} />
                        {member.name}
                      </div>
                      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{cap.used}/{cap.total}h</span>
                    </div>
                    <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p}%`, background: cap.color, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </DashCard>
        </div>

        {/* 태스크 현황 + AI 인사이트 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <DashCard title="스프린트 태스크" right={
            currentUser ? (
              <button onClick={() => setShowMyOnly(p => !p)} style={{
                fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: showMyOnly ? '#DBEAFE' : '#F3F4F6',
                color: showMyOnly ? '#1D4ED8' : '#6B7280',
              }}>
                {showMyOnly ? '내 태스크만' : '전체 보기'}
              </button>
            ) : `${tasks.length}개`
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sortedTasks.map(task => {
                const isInpro = task.status === 'inprogress'
                const isDone  = task.status === 'done'
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: isInpro ? '#EFF6FF' : 'transparent',
                    border: `1px solid ${isInpro ? '#DBEAFE' : 'transparent'}`,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: STATUS_DOT[task.status],
                    }} />
                    <span style={{
                      flex: 1, fontSize: 13,
                      color: isDone ? '#9CA3AF' : isInpro ? '#1D4ED8' : '#374151',
                      fontWeight: isInpro ? 600 : 400,
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {task.title}{isInpro ? ` (${task.progress}%)` : ''}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {task.member && <Avatar initials={task.member.initials} color={task.member.color} size={20} fontSize={8} />}
                      <SpChip points={task.points} />
                    </div>
                  </div>
                )
              })}
            </div>
          </DashCard>

          <DashCard title="AI 인사이트">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 12,
                  border: `1px solid ${ins.border}`,
                  background: ins.bg,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    {ins.icon} {ins.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{ins.desc}</div>
                </div>
              ))}
            </div>
          </DashCard>
        </div>

      </div>
    </div>
  )
}
