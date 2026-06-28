import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { useBacklogStore } from '../store/useBacklogStore'

const card = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E8EAED',
  boxShadow: '0 1px 2px rgba(17,24,39,0.04)',
}

function Avatar({ initials, color, size = 24, fontSize = 10 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  )
}

function SectionTitle({ children, count, countColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{children}</span>
      {count !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          background: countColor === 'red' ? '#FEE2E2' : countColor === 'yellow' ? '#FEF3C7' : '#F3F4F6',
          color: countColor === 'red' ? '#DC2626' : countColor === 'yellow' ? '#D97706' : '#6B7280',
          padding: '1px 8px', borderRadius: 9999,
        }}>{count}</span>
      )}
    </div>
  )
}

// 태스크 액션 버튼
function ActionBtn({ label, color = '#2563EB', bg = '#EFF6FF', border = '#BFDBFE', onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8,
      border: `1px solid ${border}`, background: bg, color, cursor: 'pointer',
    }}>{label}</button>
  )
}

// 팀원용 태스크 카드
function MyTaskCard({ task, onAction }) {
  const isBlocked = !!task.blocker
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12,
      border: `1px solid ${isBlocked ? '#FECACA' : '#E8EAED'}`,
      background: isBlocked ? '#FFF5F5' : '#FFFFFF',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isBlocked && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '1px 6px', borderRadius: 9999, flexShrink: 0 }}>블로커</span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{task.title}</span>
        {task.estimatedHours > 0 && (
          <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{task.estimatedHours}시간</span>
        )}
      </div>

      {task.blocker && (
        <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>
          선행 업무 대기 중 — 완료되면 시작 가능해요
        </p>
      )}
      {task.dueDate && (
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>마감 {task.dueDate}</p>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        {task.status === 'todo' && !isBlocked && (
          <ActionBtn label="시작하기" onClick={() => onAction(task, 'start')} />
        )}
        {task.status === 'inprogress' && (
          <>
            <ActionBtn label="완료 요청" color="#059669" bg="#D1FAE5" border="#A7F3D0" onClick={() => onAction(task, 'done')} />
            <ActionBtn label="막힘 등록" color="#DC2626" bg="#FEE2E2" border="#FECACA" onClick={() => onAction(task, 'block')} />
          </>
        )}
        <ActionBtn label="PM에게 문의" color="#6B7280" bg="#F4F5F7" border="#E8EAED" onClick={() => onAction(task, 'ask')} />
      </div>
    </div>
  )
}

// PM용 확인 필요 항목 카드
function AlertCard({ icon, label, desc, level = 'warn', action, onAction }) {
  const styles = {
    warn:   { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706' },
    danger: { bg: '#FFF5F5', border: '#FECACA', color: '#DC2626' },
    info:   { bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' },
  }
  const s = styles[level]
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
      background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: '#6B7280' }}>{desc}</p>
      </div>
      {action && (
        <button onClick={onAction} style={{
          padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8,
          border: `1px solid ${s.border}`, background: '#fff', color: s.color, cursor: 'pointer', flexShrink: 0,
        }}>{action}</button>
      )}
    </div>
  )
}

function BurndownChart({ tasks }) {
  const totalH = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
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
      <path d="M30,15 80,18 130,25 180,42 230,55 280,75 330,85 330,160 30,160Z" fill="url(#bluefill)"/>
      <circle cx="330" cy="85" r="5" fill="#2563EB" stroke="white" strokeWidth="2"/>
      <text x="30"  y="155" fontSize="10" fill="#9CA3AF">D+0</text>
      <text x="230" y="155" fontSize="10" fill="#9CA3AF">D+6</text>
      <text x="305" y="155" fontSize="10" fill="#2563EB" fontWeight="bold">오늘</text>
      <text x="430" y="155" fontSize="10" fill="#9CA3AF">D+14</text>
      <text x="35"  y="15"  fontSize="10" fill="#9CA3AF">{totalH}시간</text>
      <text x="35"  y="150" fontSize="10" fill="#9CA3AF">0</text>
    </svg>
  )
}

/* ─────────────────────────────────────────────
   팀원 홈
───────────────────────────────────────────── */
function MemberHome({ currentUser, sprint }) {
  const tasks = sprint.tasks
  const myTasks    = tasks.filter(t => t.member?.name === currentUser.name)
  const myNow      = myTasks.filter(t => t.status === 'inprogress')
  const myNext     = myTasks.filter(t => t.status === 'todo' && !t.blocker)
  const waitingMe  = tasks.filter(t => t.blocker && tasks.find(bt => bt.id === t.blocker && bt.member?.name === currentUser.name && bt.status !== 'done'))
  const iWait      = myTasks.filter(t => t.blocker && tasks.find(bt => bt.id === t.blocker && bt.status !== 'done'))

  const today = new Date()
  const weekEnd = new Date(today.getTime() + 7 * 86400000)
  const dueSoon = myTasks.filter(t => t.dueDate && new Date(t.dueDate) <= weekEnd && t.status !== 'done')

  const done    = myTasks.filter(t => t.status === 'done')
  const totalH  = myTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH   = done.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const myPct   = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0

  function handleAction(task, action) {
    // 실제 구현에서는 store action 연결
    alert(`${action}: ${task.title}`)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 새 스프린트 배정 알림 배너 */}
      {(() => {
        if (!sprint.startedAt) return null
        const hoursAgo = (Date.now() - new Date(sprint.startedAt).getTime()) / 3600000
        if (hoursAgo > 48) return null
        const myAssigned = myTasks.filter(t => t.status !== 'done')
        if (myAssigned.length === 0) return null
        return (
          <div style={{ padding: '14px 18px', borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', gap: 14 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🎉</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>새 스프린트가 시작됐어요!</p>
              <p style={{ fontSize: 12, color: '#3B82F6' }}>
                {currentUser.name}님에게 배정된 업무 {myAssigned.length}개 —{' '}
                {myAssigned.slice(0, 2).map(t => t.title).join(', ')}{myAssigned.length > 2 ? ` 외 ${myAssigned.length - 2}개` : ''}
              </p>
            </div>
          </div>
        )
      })()}

      {/* 내 진행 요약 — 완료율 + 내 태스크 수만 표시 (마감은 아래 섹션에서 확인) */}
      <div style={{ ...card, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <Avatar initials={currentUser.initials} color={currentUser.color} size={40} fontSize={16} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{currentUser.name}님, 안녕하세요</p>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>{currentUser.role} · {sprint.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: '내 배정 업무', value: myTasks.length, unit: '개' },
            { label: '완료율', value: myPct, unit: '%', color: '#10B981' },
          ].map(({ label, value, unit, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: color || '#111827' }}>
                {value}<span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF' }}>{unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* 지금 할 일 */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <SectionTitle count={myNow.length} countColor={myNow.length > 0 ? 'blue' : undefined}>
            지금 할 일
          </SectionTitle>
          {myNow.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>진행 중인 업무가 없어요</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myNow.map(t => <MyTaskCard key={t.id} task={t} onAction={handleAction} />)}
            </div>
          )}
        </div>

        {/* 다음 할 일 */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <SectionTitle count={myNext.length}>다음 할 일</SectionTitle>
          {myNext.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>준비된 업무가 없어요. PM에게 문의해보세요.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myNext.map(t => <MyTaskCard key={t.id} task={t} onAction={handleAction} />)}
            </div>
          )}
        </div>
      </div>

      {/* 의존 관계 — 있을 때만 표시 */}
      {(waitingMe.length > 0 || iWait.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* 나를 기다리는 업무 */}
          {waitingMe.length > 0 && (
            <div style={{ ...card, padding: '18px 20px' }}>
              <SectionTitle count={waitingMe.length} countColor="yellow">
                나를 기다리는 업무
              </SectionTitle>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>내 업무가 끝나야 다른 팀원이 시작할 수 있어요</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {waitingMe.map(t => (
                  <div key={t.id} style={{ padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{t.member?.name} 담당</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 내가 기다리는 업무 */}
          {iWait.length > 0 && (
            <div style={{ ...card, padding: '18px 20px' }}>
              <SectionTitle count={iWait.length} countColor="red">
                내가 기다리는 업무
              </SectionTitle>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>이 업무가 완료돼야 내 업무를 시작할 수 있어요</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {iWait.map(t => {
                  const blocker = tasks.find(bt => bt.id === t.blocker)
                  return (
                    <div key={t.id} style={{ padding: '10px 12px', borderRadius: 10, background: '#FFF5F5', border: '1px solid #FECACA' }}>
                      <p style={{ fontSize: 12, color: '#9CA3AF' }}>대기 중: {t.title}</p>
                      {blocker && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Avatar initials={blocker.member?.initials} color={blocker.member?.color || '#9CA3AF'} size={18} fontSize={8} />
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>
                            {blocker.title} ({blocker.member?.name})
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 이번 주 마감 */}
      {dueSoon.length > 0 && (
        <div style={{ ...card, padding: '18px 20px' }}>
          <SectionTitle count={dueSoon.length} countColor="yellow">이번 주 마감</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dueSoon.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706', flexShrink: 0 }}>{t.dueDate}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
                  background: t.status === 'inprogress' ? '#EFF6FF' : '#F4F5F7',
                  color: t.status === 'inprogress' ? '#2563EB' : '#6B7280',
                  border: t.status === 'inprogress' ? '1px solid #BFDBFE' : '1px solid #E8EAED',
                }}>{t.status === 'inprogress' ? '진행 중' : '예정'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 팀 전체 진행률 (접힌 상태로 기본 제공) */}
      <div style={{ ...card, padding: '18px 20px' }}>
        <SectionTitle>팀 전체 진행률</SectionTitle>
        <TeamProgressMini tasks={tasks} />
      </div>
    </div>
  )
}

function TeamProgressMini({ tasks }) {
  const done   = tasks.filter(t => t.status === 'done').length
  const total  = tasks.length
  const pct    = total > 0 ? Math.round((done / total) * 100) : 0

  const memberMap = {}
  tasks.forEach(t => {
    if (!t.member) return
    const k = t.member.name
    if (!memberMap[k]) memberMap[k] = { member: t.member, done: 0, total: 0 }
    memberMap[k].total++
    if (t.status === 'done') memberMap[k].done++
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>전체 {done}/{total}개 완료</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#2563EB' }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#2563EB', borderRadius: 4 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Object.values(memberMap).map(({ member, done: d, total: t }) => {
          const p = t > 0 ? Math.round((d / t) * 100) : 0
          return (
            <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={member.initials} color={member.color} size={22} fontSize={9} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', width: 60 }}>{member.name}</span>
              <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p}%`, background: member.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 11, color: '#9CA3AF', width: 44, textAlign: 'right' }}>{d}/{t}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PM 홈
───────────────────────────────────────────── */
function PMHome({ currentUser, sprint, onClose }) {
  const tasks     = sprint.tasks
  const done      = tasks.filter(t => t.status === 'done')
  const inpro     = tasks.filter(t => t.status === 'inprogress')
  const todo      = tasks.filter(t => t.status === 'todo')
  const totalH    = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH     = done.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const pct       = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0

  const [ey, em, ed] = sprint.endDate.replace(/-/g, '.').split('.')
  const endDate   = new Date(Number(ey), Number(em) - 1, Number(ed))
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const daysLeft  = Math.ceil((endDate - today) / 86400000)
  const daysLabel = daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : `D+${Math.abs(daysLeft)}`

  // 확인이 필요한 항목
  const noAssignee = tasks.filter(t => !t.member)
  const blockerTasks = tasks.filter(t => t.status === 'inprogress' && t.progress === 0)
  const today3 = new Date(today.getTime() + 3 * 86400000)
  const dueSoon = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= today3 && t.status !== 'done')

  // 과부하 팀원: 예상 시간 합이 40h 초과
  const memberH = {}
  tasks.filter(t => t.status !== 'done').forEach(t => {
    if (!t.member) return
    memberH[t.member.name] = (memberH[t.member.name] || 0) + (t.estimatedHours || 0)
  })
  const overloaded = Object.entries(memberH).filter(([, h]) => h > 40).map(([name]) => name)

  const alerts = [
    noAssignee.length > 0 && {
      level: 'warn', icon: '👤',
      label: `미배정 업무 ${noAssignee.length}개`,
      desc: noAssignee.slice(0, 2).map(t => t.title).join(', ') + (noAssignee.length > 2 ? ' 외' : ''),
      action: '배정하기',
    },
    blockerTasks.length > 0 && {
      level: 'danger', icon: '🔴',
      label: `블로커 ${blockerTasks.length}개 — 진행 시작 전`,
      desc: blockerTasks.map(t => `${t.title} (${t.member?.name})`).join(' · '),
      action: '확인',
    },
    // 과부하는 아래 "팀원별 남은 작업 시간" 섹션에서 표시 — 중복 제거
    dueSoon.length > 0 && {
      level: daysLeft <= 0 ? 'danger' : 'warn', icon: '📅',
      label: `마감 임박 미완료 ${dueSoon.length}개`,
      desc: dueSoon.map(t => t.title).slice(0, 2).join(', '),
      action: '확인',
    },
    todo.length > inpro.length * 2 && {
      level: 'info', icon: '📋',
      label: `대기 중 태스크 ${todo.length}개 — 착수 서두르세요`,
      desc: `진행 중(${inpro.length}개)보다 대기 중 업무가 많아요`,
    },
  ].filter(Boolean)

  const memberMap = {}
  tasks.forEach(t => {
    if (!t.member) return
    const k = t.member.name
    if (!memberMap[k]) memberMap[k] = { member: t.member, tasks: [] }
    memberMap[k].tasks.push(t)
  })
  const members = Object.values(memberMap)
  const workload = members.map(({ member, tasks: mt }) => ({
    member,
    remainH: mt.filter(t => t.status !== 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0),
    doneH:   mt.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0),
  })).sort((a, b) => b.remainH - a.remainH)
  const maxH = Math.max(...workload.map(w => w.remainH), 1)

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 핵심 지표 — 완료율 / 남은 기간 / 확인 필요 건수만 (블로커·미배정은 아래 섹션에서 상세 확인) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: '완료율', value: `${pct}%`, sub: `${done.length}/${tasks.length}개 완료`, color: '#10B981' },
          { label: '남은 기간', value: daysLeft > 0 ? `${daysLeft}일` : daysLeft === 0 ? 'D-Day' : '종료', sub: `${daysLabel} · ${sprint.endDate}`, color: daysLeft <= 3 ? '#EF4444' : '#111827' },
          { label: '확인 필요', value: alerts.length, sub: alerts.length > 0 ? '아래에서 자세히 확인' : '이상 없음', color: alerts.length > 0 ? '#D97706' : '#10B981' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ ...card, padding: '18px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ▶ 확인이 필요한 항목 — PM 홈 첫 번째 주요 섹션 */}
      {alerts.length > 0 && (
        <div style={{ ...card, padding: '18px 20px' }}>
          <SectionTitle count={alerts.length} countColor={alerts.some(a => a.level === 'danger') ? 'red' : 'yellow'}>
            확인이 필요한 항목
          </SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => (
              <AlertCard key={i} {...a} />
            ))}
          </div>
        </div>
      )}
      {alerts.length === 0 && (
        <div style={{ ...card, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>확인이 필요한 항목이 없어요. 팀이 순조롭게 진행 중이에요.</p>
        </div>
      )}

      {/* 팀원별 남은 예상 시간 */}
      <div style={{ ...card, padding: '18px 20px' }}>
        <SectionTitle>팀원별 남은 작업 시간</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {workload.map(({ member, remainH, doneH: dH }) => {
            const over = remainH > 40
            return (
              <div key={member.name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar initials={member.initials} color={member.color} size={22} fontSize={9} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{member.name}</span>
                    {over && <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '1px 6px', borderRadius: 9999 }}>과부하</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    <span style={{ color: '#10B981', fontWeight: 600 }}>{dH}시간 완료</span>
                    {remainH > 0 && <span> · 잔여 {remainH}시간</span>}
                  </div>
                </div>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((remainH / maxH) * 100)}%`, background: over ? '#EF4444' : member.color, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 번다운 */}
      <div style={{ ...card, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionTitle>번다운 차트</SectionTitle>
          <a href="/sprint/1/board" style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
            칸반 보드에서 태스크 확인 →
          </a>
        </div>
        <BurndownChart tasks={tasks} />
      </div>

    </div>
  )
}

/* ─────────────────────────────────────────────
   메인 export
───────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const { sprint, closeSprint } = useSprintStore()
  const { currentUser, can }   = useAuthStore()
  const { add: addToBacklog }  = useBacklogStore()
  const [closeModal, setCloseModal] = useState(false)

  const isPM = currentUser?.role === 'PM'

  function handleClose() {
    const incomplete = closeSprint()
    incomplete.forEach(t => addToBacklog({
      title: t.title, priority: t.priority, estimatedHours: t.estimatedHours || 0,
      desc: `[${sprint.name}에서 이월]`, category: '기능', stage: 'MVP',
    }, currentUser?.id || null))
    setCloseModal(false)
    navigate('/retro')
  }

  // 스프린트 없을 때
  if (!sprint?.status || sprint.status === 'completed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Topbar title="대시보드" subtitle="진행 중인 계획 없음" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#F4F5F7' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📊</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>진행 중인 계획이 없어요</p>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              {sprint?.status === 'completed' ? '스프린트가 종료됐어요. 회고 후 새 계획을 시작해보세요.' : '이번 계획 만들기에서 스프린트를 만들어보세요.'}
            </p>
          </div>
          <a href={sprint?.status === 'completed' ? '/retro' : '/sprint/builder'}
            style={{ padding: '0 20px', height: 40, borderRadius: 12, background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            {sprint?.status === 'completed' ? '회고 시작하기' : '이번 계획 만들기'}
          </a>
        </div>
      </div>
    )
  }

  const subtitle = isPM
    ? `${sprint.name} · PM 뷰`
    : currentUser ? `${sprint.name} · ${currentUser.name}님` : sprint.name

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* 종료 확인 모달 */}
      {closeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setCloseModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 60px rgba(17,24,39,0.2)' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>스프린트를 종료할까요?</p>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>미완료 업무는 전체 할 일로 이월됩니다.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setCloseModal(false)} style={{ padding: '0 18px', height: 38, borderRadius: 10, border: '1px solid #E8EAED', background: '#F4F5F7', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>취소</button>
              <button onClick={handleClose} style={{ padding: '0 18px', height: 38, borderRadius: 10, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>종료 및 회고 시작</button>
            </div>
          </div>
        </div>
      )}

      <Topbar title="대시보드" subtitle={subtitle}>
        {isPM && can.confirmSprint && sprint.status !== 'completed' && (
          <button onClick={() => setCloseModal(true)} style={{
            padding: '0 16px', height: 36, borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer',
          }}>스프린트 종료</button>
        )}
      </Topbar>

      {/* 역할별 분기 */}
      {isPM ? (
        <PMHome currentUser={currentUser} sprint={sprint} onClose={() => setCloseModal(true)} />
      ) : currentUser ? (
        <MemberHome currentUser={currentUser} sprint={sprint} />
      ) : (
        // 비로그인: 팀 전체 현황만
        <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...card, padding: '18px 20px' }}>
            <SectionTitle>팀 전체 진행률</SectionTitle>
            <TeamProgressMini tasks={sprint.tasks} />
          </div>
          <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: 13 }}>
            왼쪽에서 팀원을 선택하면 내 할 일을 볼 수 있어요
          </div>
        </div>
      )}
    </div>
  )
}
