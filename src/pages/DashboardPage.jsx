import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { useBacklogStore } from '../store/useBacklogStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { useTeamStore } from '../store/useTeamStore'
import { useIsMobile } from '../hooks/useIsMobile'

const ROLE_KEYWORDS = {
  백엔드:    /api|서버|db|데이터베이스|인증|로그인|crud|저장|연동|스키마|마이그레이션|백엔드|backend/,
  프론트:    /ui|화면|페이지|컴포넌트|버튼|레이아웃|뷰|렌더|표시|모달|폼|프론트|frontend/,
  'AI/백엔드': /ai|알고리즘|추천|분석|모델|자동|예측|계획|초안|분해/,
  디자인:    /디자인|아이콘|스타일|색상|대시보드|ux|ui 디자인/,
}
function suggestMembers(title, members) {
  const t = title.toLowerCase()
  const eligible = members.filter(m => m.role !== 'PM')
  if (!eligible.length) return []
  const scores = eligible.map(m => {
    let score = 0
    Object.entries(ROLE_KEYWORDS).forEach(([key, re]) => { if (m.role.includes(key) && re.test(t)) score += 3 })
    return { ...m, score }
  })
  const max = Math.max(...scores.map(s => s.score))
  return (max <= 0 ? [scores[0]] : scores.filter(s => s.score === max)).slice(0, 2)
}

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

// 번다운 차트 — 실제 날짜·시간 기반
function BurndownChart({ tasks, startDate, endDate }) {
  const totalH = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH  = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0)

  const start = new Date(startDate.replace(/\./g, '-'))
  const end   = new Date(endDate.replace(/\./g, '-'))
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const totalDays = Math.max(1, Math.round((end - start) / 86400000))
  const elapsed   = Math.min(totalDays, Math.max(0, Math.round((today - start) / 86400000)))

  // 이상적: 매일 균등 감소
  // 실제: 오늘까지 doneH만큼 감소했다고 가정 (완료 날짜 데이터 없음)
  const W = 500, H = 160, PAD_L = 40, PAD_R = 20, PAD_T = 20, PAD_B = 30
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  function xOf(day) { return PAD_L + (day / totalDays) * chartW }
  function yOf(h)   { return PAD_T + (1 - h / Math.max(totalH, 1)) * chartH }

  // 이상적 라인
  const idealStart = `${xOf(0)},${yOf(totalH)}`
  const idealEnd   = `${xOf(totalDays)},${yOf(0)}`

  // 실제 라인 (오늘까지)
  const actualPts  = `${xOf(0)},${yOf(totalH)} ${xOf(elapsed)},${yOf(totalH - doneH)}`
  // 오늘 이후 점선 추정 (현재 속도로 계속)
  const ratePerDay = elapsed > 0 ? doneH / elapsed : 0
  const projectedDaysLeft = ratePerDay > 0 ? (totalH - doneH) / ratePerDay : 0
  const projEndDay = Math.min(totalDays, elapsed + projectedDaysLeft)
  const projPts    = `${xOf(elapsed)},${yOf(totalH - doneH)} ${xOf(projEndDay)},${yOf(0)}`

  const todayX = xOf(elapsed)
  const todayY = yOf(totalH - doneH)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      <defs>
        <linearGradient id="bluefill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* 그리드 수평선 */}
      {[0, 0.25, 0.5, 0.75, 1].map(r => (
        <line key={r} x1={PAD_L} y1={yOf(totalH * r)} x2={W - PAD_R} y2={yOf(totalH * r)}
          stroke="#F3F4F6" strokeWidth="1"/>
      ))}

      {/* 이상적 라인 */}
      <line x1={idealStart.split(',')[0]} y1={idealStart.split(',')[1]}
            x2={idealEnd.split(',')[0]}   y2={idealEnd.split(',')[1]}
        stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="5,3"/>

      {/* 실제 라인 */}
      <polyline points={actualPts}
        fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* 예상 라인 */}
      {elapsed < totalDays && ratePerDay > 0 && (
        <polyline points={projPts}
          fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4"/>
      )}

      {/* 채움 */}
      <path d={`M${PAD_L},${yOf(totalH)} ${actualPts.split(' ').slice(1).join(' ')} ${xOf(elapsed)},${PAD_T + chartH} ${PAD_L},${PAD_T + chartH}Z`}
        fill="url(#bluefill)"/>

      {/* 오늘 점 */}
      <circle cx={todayX} cy={todayY} r="5" fill="#2563EB" stroke="white" strokeWidth="2"/>
      <line x1={todayX} y1={PAD_T} x2={todayX} y2={PAD_T + chartH} stroke="#2563EB" strokeWidth="1" strokeDasharray="3,2" opacity="0.3"/>

      {/* 레이블 */}
      <text x={PAD_L}     y={H - 4} fontSize="10" fill="#9CA3AF">시작</text>
      <text x={todayX - 8} y={H - 4} fontSize="10" fill="#2563EB" fontWeight="bold">오늘</text>
      <text x={W - PAD_R - 20} y={H - 4} fontSize="10" fill="#9CA3AF">종료</text>
      <text x={PAD_L + 2} y={PAD_T + 12} fontSize="10" fill="#9CA3AF">{totalH}h</text>
      <text x={PAD_L + 2} y={PAD_T + chartH} fontSize="10" fill="#9CA3AF">0</text>
    </svg>
  )
}

// 태스크 상태 분포 바
function StatusDistBar({ tasks }) {
  const STATUS_LIST = [
    { key: 'todo',       label: '예정',    color: '#E5E7EB' },
    { key: 'inprogress', label: '진행 중', color: '#2563EB' },
    { key: 'review',     label: '검토 중', color: '#F59E0B' },
    { key: 'done',       label: '완료',    color: '#10B981' },
    { key: null,         label: '미배정',  color: '#9CA3AF' },
  ]
  const counts = {}
  tasks.forEach(t => {
    const k = t.member ? (t.status || 'todo') : null
    counts[k] = (counts[k] || 0) + 1
  })
  const total = tasks.length || 1

  return (
    <div>
      {/* 분포 바 */}
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 1, marginBottom: 10 }}>
        {STATUS_LIST.map(({ key, color }) => {
          const pct = ((counts[key] || 0) / total) * 100
          if (pct === 0) return null
          return <div key={String(key)} style={{ width: `${pct}%`, background: color }} />
        })}
      </div>
      {/* 범례 */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {STATUS_LIST.map(({ key, label, color }) => {
          const n = counts[key] || 0
          if (n === 0) return null
          return (
            <div key={String(key)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{n}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 간트 차트
function GanttChart({ tasks, startDate, endDate }) {
  const start = new Date(startDate.replace(/\./g, '-'))
  const end   = new Date(endDate.replace(/\./g, '-'))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const totalDays = Math.max(1, Math.round((end - start) / 86400000))

  const STATUS_COLOR = { done: '#10B981', inprogress: '#2563EB', review: '#F59E0B', todo: '#D1D5DB' }
  const LABEL_W = 220, ROW_H = 38, CHART_W = 560, PAD_TOP = 28
  const W = LABEL_W + CHART_W

  function xOf(date) {
    const d = new Date(date); d.setHours(0, 0, 0, 0)
    return LABEL_W + Math.max(0, Math.min(1, (d - start) / ((end - start) || 1))) * CHART_W
  }

  const interval = totalDays > 21 ? 7 : totalDays > 10 ? 3 : 1
  const markers = []
  for (let i = 0; i <= totalDays; i += interval) {
    const d = new Date(start.getTime() + i * 86400000)
    markers.push({ x: LABEL_W + (i / totalDays) * CHART_W, label: `${d.getMonth()+1}/${d.getDate()}` })
  }

  const todayX = xOf(today)
  const totalH = PAD_TOP + tasks.length * ROW_H + 8

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${totalH}`} style={{ width: '100%', minWidth: W, height: totalH, display: 'block' }}>
        {/* 날짜 마커 */}
        {markers.map((m, i) => (
          <g key={i}>
            <line x1={m.x} y1={PAD_TOP - 8} x2={m.x} y2={totalH} stroke="#F3F4F6" strokeWidth="1"/>
            <text x={m.x} y={PAD_TOP - 10} fontSize="10" fill="#9CA3AF" textAnchor="middle">{m.label}</text>
          </g>
        ))}

        {/* 오늘 라인 */}
        {todayX >= LABEL_W && todayX <= W && (
          <>
            <line x1={todayX} y1={0} x2={todayX} y2={totalH} stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.7"/>
            <text x={todayX} y={PAD_TOP - 10} fontSize="10" fill="#EF4444" textAnchor="middle" fontWeight="bold">오늘</text>
          </>
        )}

        {/* 헤더 구분선 */}
        <line x1={0} y1={PAD_TOP - 2} x2={W} y2={PAD_TOP - 2} stroke="#E8EAED" strokeWidth="1"/>

        {/* 태스크 행 */}
        {tasks.map((task, i) => {
          const y = PAD_TOP + i * ROW_H
          const color = STATUS_COLOR[task.status] || '#D1D5DB'
          const barX1 = LABEL_W + 4
          const barX2 = task.dueDate ? Math.min(xOf(new Date(task.dueDate)), LABEL_W + CHART_W - 4) : LABEL_W + CHART_W - 4
          const barW = Math.max(6, barX2 - barX1)
          const opacity = task.status === 'todo' ? 0.35 : 0.85

          return (
            <g key={task.id}>
              <rect x={0} y={y} width={W} height={ROW_H - 1} fill={i % 2 === 0 ? '#FAFAFA' : '#FFF'}/>

              {/* 담당자 아바타 */}
              {task.member ? (
                <>
                  <circle cx={14} cy={y + ROW_H/2} r={10} fill={task.member.color}/>
                  <text x={14} y={y + ROW_H/2 + 4} fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">
                    {task.member.initials}
                  </text>
                </>
              ) : (
                <circle cx={14} cy={y + ROW_H/2} r={10} fill="#E5E7EB"/>
              )}

              {/* 태스크 제목 */}
              <text x={30} y={y + ROW_H/2 + 4} fontSize="12" fill="#374151">
                {task.title.length > 18 ? task.title.slice(0, 18) + '…' : task.title}
              </text>

              {/* 담당자 이름 (작게) */}
              {task.member && (
                <text x={30} y={y + ROW_H/2 + 14} fontSize="9" fill="#9CA3AF">
                  {task.member.name}
                </text>
              )}

              {/* 간트 바 */}
              <rect x={barX1} y={y + 8} width={barW} height={ROW_H - 18} fill={color} rx="3" opacity={opacity}/>

              {/* 완료 표시 */}
              {task.status === 'done' && (
                <text x={barX1 + barW/2} y={y + ROW_H/2 + 4} fontSize="9" fill="white" textAnchor="middle" fontWeight="bold">✓</text>
              )}
            </g>
          )
        })}
      </svg>
      {/* 범례 */}
      <div style={{ display: 'flex', gap: 16, padding: '10px 4px 0', flexWrap: 'wrap' }}>
        {[['done','#10B981','완료'], ['inprogress','#2563EB','진행 중'], ['review','#F59E0B','검토 중'], ['todo','#D1D5DB','예정']].map(([,c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 8, borderRadius: 2, background: c }}/>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{l}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 2, background: '#EF4444' }}/>
          <span style={{ fontSize: 11, color: '#6B7280' }}>오늘</span>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PM 홈
───────────────────────────────────────────── */
function PMHome({ currentUser, sprint, onSendNotification, teamMembers = [], updateTask, isMobile }) {
  const [expandedMember, setExpandedMember] = useState(null)
  const [activeTab, setActiveTab] = useState('현황')
  const [sendModal, setSendModal] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')

  const tasks     = sprint.tasks
  const done      = tasks.filter(t => t.status === 'done')
  const inpro     = tasks.filter(t => t.status === 'inprogress')
  const todo      = tasks.filter(t => t.status === 'todo')
  const totalH    = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH     = done.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const pct       = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0

  const parseDate = d => new Date(d.replace(/\./g, '-'))
  const endDate   = parseDate(sprint.endDate)
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const daysLeft  = Math.ceil((endDate - today) / 86400000)
  const daysLabel = daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : `D+${Math.abs(daysLeft)}`

  const noAssignee  = tasks.filter(t => !t.member)
  const today3      = new Date(today.getTime() + 3 * 86400000)
  const dueSoon     = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= today3 && t.status !== 'done')
  // 블로커: 선행 업무가 아직 완료 안 됐는데 시작하려는 태스크
  const blockerTasks = tasks.filter(t => t.blocker && tasks.find(b => b.id === t.blocker && b.status !== 'done'))

  const memberH = {}
  tasks.filter(t => t.status !== 'done').forEach(t => {
    if (!t.member) return
    memberH[t.member.name] = (memberH[t.member.name] || 0) + (t.estimatedHours || 0)
  })
  const overloaded = Object.entries(memberH).filter(([, h]) => h > 40).map(([n]) => n)

  const alerts = [
    noAssignee.length > 0 && {
      level: 'warn', icon: '👤',
      label: `미배정 업무 ${noAssignee.length}개`,
      desc: noAssignee.slice(0, 2).map(t => t.title).join(', ') + (noAssignee.length > 2 ? ' 외' : ''),
    },
    blockerTasks.length > 0 && {
      level: 'danger', icon: '🔴',
      label: `블로커 ${blockerTasks.length}개 — 선행 업무 대기 중`,
      desc: blockerTasks.slice(0, 2).map(t => t.title).join(' · '),
    },
    dueSoon.length > 0 && {
      level: daysLeft <= 0 ? 'danger' : 'warn', icon: '📅',
      label: `마감 임박 미완료 ${dueSoon.length}개`,
      desc: dueSoon.slice(0, 2).map(t => t.title).join(', '),
    },
    overloaded.length > 0 && {
      level: 'warn', icon: '⚠️',
      label: `과부하 팀원 ${overloaded.length}명`,
      desc: `${overloaded.join(', ')} — 남은 배정 시간이 40시간을 넘어요`,
    },
    todo.length > inpro.length * 2 && todo.length > 3 && {
      level: 'info', icon: '📋',
      label: `대기 중 태스크 ${todo.length}개 — 착수를 서두르세요`,
      desc: `진행 중(${inpro.length}개)보다 대기 중 업무가 훨씬 많아요`,
    },
  ].filter(Boolean)

  // 팀원별 워크로드
  const memberMap = {}
  tasks.forEach(t => {
    if (!t.member) return
    const k = t.member.name
    if (!memberMap[k]) memberMap[k] = { member: t.member, tasks: [] }
    memberMap[k].tasks.push(t)
  })
  const workload = Object.values(memberMap).map(({ member, tasks: mt }) => ({
    member,
    tasks: mt,
    remainH: mt.filter(t => t.status !== 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0),
    doneH:   mt.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0),
    total:   mt.reduce((s, t) => s + (t.estimatedHours || 0), 0),
  })).sort((a, b) => b.remainH - a.remainH)
  const maxRemainH = Math.max(...workload.map(w => w.remainH), 1)

  const STATUS_STYLE = {
    done:       { bg: '#D1FAE5', color: '#059669', label: '완료' },
    inprogress: { bg: '#EFF6FF', color: '#2563EB', label: '진행 중' },
    review:     { bg: '#FEF3C7', color: '#D97706', label: '검토 중' },
    todo:       { bg: '#F3F4F6', color: '#6B7280', label: '예정' },
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: isMobile ? '14px 16px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 알림 발송 모달 */}
      {sendModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setSendModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 440, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 60px rgba(17,24,39,0.2)' }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>📢 팀에게 알림 보내기</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>모든 팀원의 알림함에 전달됩니다</p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: '#F4F5F7', border: '1px solid #E8EAED' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>스프린트 현황 자동 요약</p>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: '18px' }}>
                📊 {sprint.name} 현황: 완료 {tasks.filter(t=>t.status==='done').length}/{tasks.length}개 ({pct}%) · 남은 기간 {daysLeft}일
                {blockerTasks.length > 0 ? ` · 블로커 ${blockerTasks.length}건` : ''}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 6 }}>추가 메시지 (선택)</label>
              <textarea
                value={notifMsg}
                onChange={e => setNotifMsg(e.target.value)}
                placeholder="팀원들에게 전달할 내용을 입력하세요..."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8EAED', borderRadius: 10, fontSize: 13, color: '#111827', resize: 'none', outline: 'none', boxSizing: 'border-box', background: '#F9FAFB' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setSendModal(false)} style={{ padding: '0 18px', height: 38, borderRadius: 10, border: '1px solid #E8EAED', background: '#F4F5F7', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>취소</button>
              <button onClick={() => {
                const summary = `📊 ${sprint.name} 현황: 완료 ${tasks.filter(t=>t.status==='done').length}/${tasks.length}개 (${pct}%) · 남은 ${daysLeft}일${blockerTasks.length > 0 ? ` · 블로커 ${blockerTasks.length}건` : ''}`
                onSendNotification(summary, notifMsg)
                setNotifMsg('')
                setSendModal(false)
              }} style={{ padding: '0 18px', height: 38, borderRadius: 10, border: 'none', background: '#2563EB', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                📢 알림 보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 탭 + 알림 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, background: '#E8EAED', borderRadius: 10, padding: 3 }}>
          {['현황', '간트'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === tab ? '#fff' : 'transparent',
              color: activeTab === tab ? '#111827' : '#6B7280',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>{tab}</button>
          ))}
        </div>
        <button onClick={() => setSendModal(true)} style={{
          padding: '0 14px', height: 36, borderRadius: 10, border: '1px solid #BFDBFE',
          background: '#EFF6FF', color: '#2563EB', fontSize: isMobile ? 12 : 13, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>📢 {isMobile ? '알림 보내기' : '팀에게 알림 보내기'}</button>
      </div>

      {/* 간트 뷰 */}
      {activeTab === '간트' && (
        <div style={{ ...card, padding: '16px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>전체 태스크 간트 뷰</p>
          <GanttChart tasks={tasks} startDate={sprint.startDate} endDate={sprint.endDate} />
        </div>
      )}

      {activeTab === '현황' && <>

      {/* 핵심 지표 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 12 }}>
        {[
          { label: '완료율', value: `${pct}%`, sub: `${done.length}/${tasks.length}개 완료`, color: pct >= 70 ? '#10B981' : '#111827' },
          { label: '진행 중', value: inpro.length, sub: `예정 ${todo.length}개 대기`, color: inpro.length > 0 ? '#2563EB' : '#9CA3AF', unit: '개' },
          { label: '남은 기간', value: daysLeft > 0 ? `${daysLeft}일` : daysLeft === 0 ? 'D-Day' : '종료', sub: `${daysLabel} · ${sprint.endDate}`, color: daysLeft <= 3 ? '#EF4444' : '#111827' },
          { label: '확인 필요', value: alerts.length, sub: alerts.length > 0 ? '아래에서 확인' : '이상 없음 ✓', color: alerts.length > 0 ? '#D97706' : '#10B981', unit: '건' },
        ].map(({ label, value, sub, color, unit }) => (
          <div key={label} style={{ ...card, padding: isMobile ? '12px 14px' : '16px 18px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.04em' }}>{label}</p>
            <p style={{ fontSize: isMobile ? 22 : 24, fontWeight: 800, color, lineHeight: 1 }}>
              {value}{unit && <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF' }}>{unit}</span>}
            </p>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* 태스크 상태 분포 */}
      <div style={{ ...card, padding: '16px 20px' }}>
        <SectionTitle>태스크 상태 분포</SectionTitle>
        <StatusDistBar tasks={tasks} />
      </div>

      {/* 확인 필요 항목 */}
      {alerts.length > 0 ? (
        <div style={{ ...card, padding: '16px 20px' }}>
          <SectionTitle count={alerts.length} countColor={alerts.some(a => a.level === 'danger') ? 'red' : 'yellow'}>
            확인이 필요한 항목
          </SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => <AlertCard key={i} {...a} />)}
          </div>
        </div>
      ) : (
        <div style={{ ...card, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>확인이 필요한 항목이 없어요. 팀이 순조롭게 진행 중이에요.</p>
        </div>
      )}

      {/* 팀원별 워크로드 + 태스크 목록 */}
      <div style={{ ...card, padding: '16px 20px' }}>
        <SectionTitle>팀원별 현황</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {workload.map(({ member, tasks: mt, remainH, doneH: dH, total }) => {
            const cap = teamMembers.find(m => m.name === member.name)?.capacity ?? 80
            const over = remainH > cap
            const isExpanded = expandedMember === member.name
            const doneCnt = mt.filter(t => t.status === 'done').length
            return (
              <div key={member.name} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #F3F4F6', marginBottom: 4 }}>
                {/* 헤더 — 클릭으로 펼치기 */}
                <div onClick={() => setExpandedMember(isExpanded ? null : member.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: isExpanded ? '#F9FAFB' : '#fff', userSelect: 'none' }}>
                  <Avatar initials={member.initials} color={member.color} size={28} fontSize={11} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{member.name}</span>
                      {over && <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '1px 6px', borderRadius: 9999 }}>과부하</span>}
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>{doneCnt}/{mt.length}개 완료</span>
                    </div>
                    <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${total > 0 ? Math.round((remainH / maxRemainH) * 100) : 0}%`, background: over ? '#EF4444' : member.color, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>{dH}h 완료</div>
                    {remainH > 0 && <div style={{ fontSize: 11, color: '#9CA3AF' }}>잔여 {remainH}h</div>}
                  </div>
                  <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* 펼쳐진 태스크 목록 */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4, background: '#FAFAFA' }}>
                    {mt.map(t => {
                      const ss = STATUS_STYLE[t.status] || STATUS_STYLE.todo
                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: '#fff', border: '1px solid #F3F4F6' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: ss.bg, color: ss.color, flexShrink: 0 }}>
                            {ss.label}
                          </span>
                          <span style={{ fontSize: 13, color: '#111827', flex: 1 }}>{t.title}</span>
                          {t.estimatedHours > 0 && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{t.estimatedHours}h</span>}
                          {t.dueDate && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>~{t.dueDate}</span>}
                          {t.blocker && <span style={{ fontSize: 10, color: '#DC2626', background: '#FEE2E2', padding: '1px 6px', borderRadius: 9999, flexShrink: 0 }}>블로커</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {noAssignee.length > 0 && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', marginTop: 4 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#D97706', marginBottom: 8 }}>👤 미배정 태스크 {noAssignee.length}개</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {noAssignee.map(t => {
                  const suggested = suggestMembers(t.title, teamMembers)
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: '7px 10px', border: '1px solid #FDE68A' }}>
                      <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{t.title}</span>
                      {suggested.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>AI 추천</span>
                          {suggested.map(m => (
                            <button key={m.id} title={`${m.name} (${m.role}) 배정`}
                              onClick={() => updateTask(t.id, { member: { name: m.name, color: m.color, initials: m.initials || m.name[0] } })}
                              style={{ width: 26, height: 26, borderRadius: '50%', background: m.color, color: '#fff', border: '2px solid #fff', boxShadow: '0 0 0 1.5px ' + m.color, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {m.initials || m.name[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 번다운 차트 */}
      <div style={{ ...card, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionTitle>번다운 차트</SectionTitle>
          <a href="/sprint/1/board" style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
            칸반 보드 →
          </a>
        </div>
        <BurndownChart tasks={tasks} startDate={sprint.startDate} endDate={sprint.endDate} />
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="4,2"/></svg>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>이상적 속도</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#2563EB" strokeWidth="2"/></svg>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>실제 진행</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.4"/></svg>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>예상 추세</span>
          </div>
        </div>
      </div>

      </> }
    </div>
  )
}

/* ─────────────────────────────────────────────
   팀원 홈
───────────────────────────────────────────── */
function MemberHome({ currentUser, sprint, moveTask, isMobile }) {
  const tasks      = sprint.tasks
  const myTasks    = tasks.filter(t => t.member?.name === currentUser.name)
  const myNow      = myTasks.filter(t => t.status === 'inprogress')
  const myNext     = myTasks.filter(t => t.status === 'todo' && !t.blocker)
  const myReview   = myTasks.filter(t => t.status === 'review')
  const iWait      = myTasks.filter(t => t.blocker && tasks.find(b => b.id === t.blocker && b.status !== 'done'))
  // 내 업무가 끝나야 착수 가능한 다른 태스크
  const waitingOnMe = tasks.filter(t =>
    t.blocker && myTasks.find(m => m.id === t.blocker && m.status !== 'done')
  )

  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const week3    = new Date(today.getTime() + 3 * 86400000)
  const dueSoon  = myTasks.filter(t => t.dueDate && new Date(t.dueDate) <= week3 && t.status !== 'done')

  const done     = myTasks.filter(t => t.status === 'done')
  const totalH   = myTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH    = done.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const myPct    = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0

  // 팀 전체 진행률
  const allDoneH   = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const allTotalH  = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const teamPct    = allTotalH > 0 ? Math.round((allDoneH / allTotalH) * 100) : 0
  const parseDate  = d => new Date(d.replace(/\./g, '-'))
  const daysLeft   = Math.ceil((parseDate(sprint.endDate) - today) / 86400000)

  function TaskCard({ task }) {
    const isBlocked = !!task.blocker && tasks.find(b => b.id === task.blocker && b.status !== 'done')
    const blocker   = isBlocked ? tasks.find(b => b.id === task.blocker) : null
    return (
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        border: `1px solid ${isBlocked ? '#FECACA' : '#E8EAED'}`,
        background: isBlocked ? '#FFF5F5' : '#fff',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isBlocked && <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA', padding: '1px 6px', borderRadius: 9999, flexShrink: 0 }}>블로커</span>}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1 }}>{task.title}</span>
          {task.estimatedHours > 0 && <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{task.estimatedHours}h</span>}
        </div>
        {blocker && (
          <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>
            ⏳ {blocker.title} ({blocker.member?.name}) 완료 후 시작 가능
          </p>
        )}
        {task.dueDate && (
          <p style={{ fontSize: 11, color: new Date(task.dueDate) <= week3 ? '#D97706' : '#9CA3AF', margin: 0 }}>
            📅 마감 {task.dueDate}
          </p>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          {task.status === 'todo' && !isBlocked && (
            <button onClick={() => moveTask(task.id, 'inprogress')}
              style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', cursor: 'pointer' }}>
              시작하기
            </button>
          )}
          {task.status === 'inprogress' && (<>
            <button onClick={() => moveTask(task.id, 'review')}
              style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid #A7F3D0', background: '#D1FAE5', color: '#059669', cursor: 'pointer' }}>
              검토 요청
            </button>
            <button onClick={() => moveTask(task.id, 'done')}
              style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', cursor: 'pointer' }}>
              완료
            </button>
          </>)}
          {task.status === 'review' && (
            <span style={{ fontSize: 11, color: '#D97706', padding: '5px 0' }}>PM 검토 중...</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: isMobile ? '14px 16px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 새 스프린트 알림 */}
      {sprint.startedAt && (() => {
        const hoursAgo = (Date.now() - new Date(sprint.startedAt).getTime()) / 3600000
        if (hoursAgo > 48 || myTasks.filter(t => t.status !== 'done').length === 0) return null
        return (
          <div style={{ padding: '14px 18px', borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', gap: 14 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🎉</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>새 스프린트가 시작됐어요!</p>
              <p style={{ fontSize: 12, color: '#3B82F6' }}>
                {currentUser.name}님 배정 {myTasks.filter(t => t.status !== 'done').length}개 — {myTasks.filter(t => t.status !== 'done').slice(0, 2).map(t => t.title).join(', ')}
              </p>
            </div>
          </div>
        )
      })()}

      {/* 내 요약 카드 */}
      <div style={{ ...card, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <Avatar initials={currentUser.initials} color={currentUser.color} size={44} fontSize={17} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{currentUser.name}님, 안녕하세요</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>{currentUser.role} · {sprint.name}</p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: '내 배정', value: myTasks.length, unit: '개' },
              { label: '내 완료율', value: myPct, unit: '%', color: myPct >= 50 ? '#10B981' : '#F59E0B' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: color || '#111827', lineHeight: 1 }}>
                  {value}<span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF' }}>{unit}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* 내 완료율 바 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>내 진행률</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{doneH}h / {totalH}h</span>
          </div>
          <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${myPct}%`, background: currentUser.color || '#2563EB', borderRadius: 3, transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* 팀 현황 미니 (상단 배치) */}
      <div style={{ ...card, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>팀 전체 진행률</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>{teamPct}%</span>
          </div>
          <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${teamPct}%`, background: '#2563EB', borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0 }}>
          남은 기간 <strong style={{ color: daysLeft <= 3 ? '#EF4444' : '#111827' }}>{daysLeft > 0 ? `${daysLeft}일` : 'D-Day'}</strong>
        </div>
      </div>

      {/* 마감 임박 경고 */}
      {dueSoon.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>⏰</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#D97706', marginBottom: 2 }}>3일 내 마감 {dueSoon.length}개</p>
            <p style={{ fontSize: 11, color: '#92400E' }}>{dueSoon.map(t => t.title).join(', ')}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        {/* 지금 할 일 */}
        <div style={{ ...card, padding: '16px 18px' }}>
          <SectionTitle count={myNow.length} countColor={myNow.length > 0 ? 'blue' : undefined}>지금 할 일</SectionTitle>
          {myNow.length === 0
            ? <p style={{ fontSize: 13, color: '#9CA3AF' }}>진행 중인 업무가 없어요</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{myNow.map(t => <TaskCard key={t.id} task={t} />)}</div>
          }
        </div>

        {/* 다음 할 일 */}
        <div style={{ ...card, padding: '16px 18px' }}>
          <SectionTitle count={myNext.length}>다음 할 일</SectionTitle>
          {myNext.length === 0
            ? <p style={{ fontSize: 13, color: '#9CA3AF' }}>준비된 업무가 없어요</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{myNext.map(t => <TaskCard key={t.id} task={t} />)}</div>
          }
        </div>
      </div>

      {/* 검토 중 */}
      {myReview.length > 0 && (
        <div style={{ ...card, padding: '16px 18px' }}>
          <SectionTitle count={myReview.length} countColor="yellow">검토 요청 중</SectionTitle>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>PM이 확인 중이에요</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {myReview.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        </div>
      )}

      {/* 의존성 */}
      {(waitingOnMe.length > 0 || iWait.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          {waitingOnMe.length > 0 && (
            <div style={{ ...card, padding: '16px 18px' }}>
              <SectionTitle count={waitingOnMe.length} countColor="yellow">나를 기다리는 업무</SectionTitle>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>내 업무가 끝나야 다른 팀원이 시작해요</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {waitingOnMe.map(t => (
                  <div key={t.id} style={{ padding: '8px 10px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{t.member?.name} 담당</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {iWait.length > 0 && (
            <div style={{ ...card, padding: '16px 18px' }}>
              <SectionTitle count={iWait.length} countColor="red">내가 기다리는 업무</SectionTitle>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>이 업무가 끝나야 내가 시작 가능해요</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {iWait.map(t => {
                  const blocker = tasks.find(b => b.id === t.blocker)
                  return (
                    <div key={t.id} style={{ padding: '8px 10px', borderRadius: 8, background: '#FFF5F5', border: '1px solid #FECACA' }}>
                      <p style={{ fontSize: 11, color: '#9CA3AF' }}>대기: {t.title}</p>
                      {blocker && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <Avatar initials={blocker.member?.initials} color={blocker.member?.color || '#9CA3AF'} size={16} fontSize={7} />
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>{blocker.title}</p>
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
    </div>
  )
}

/* ─────────────────────────────────────────────
   메인 export
───────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { sprint, closeSprint, moveTask, updateTask } = useSprintStore()
  const { currentUser, can }              = useAuthStore()
  const { add: addToBacklog }             = useBacklogStore()
  const { push: pushNotif }               = useNotificationStore()
  const { settings, members: teamMembers } = useTeamStore()
  const [closeModal, setCloseModal]       = useState(false)
  const [welcomeToast, setWelcomeToast]   = useState(null)

  useEffect(() => {
    const flag = sessionStorage.getItem('onboarding_done')
    if (flag) {
      sessionStorage.removeItem('onboarding_done')
      setWelcomeToast(flag === 'pm' ? '팀이 준비됐어요! 팀원을 초대하고 첫 스프린트를 시작해보세요 🚀' : '환영해요! 담당 태스크를 확인해보세요 →')
      setTimeout(() => setWelcomeToast(null), 4500)
    }
  }, [])

  function handleSendNotification(summary, extra) {
    pushNotif({ icon: '📢', title: 'PM 공지', body: summary + (extra ? '\n' + extra : '') })
    // Discord 웹훅이 설정된 경우 발송
    if (settings.discordWebhook) {
      fetch(settings.discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: summary + (extra ? '\n' + extra : '') }),
      }).catch(() => {})
    }
  }

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

      {welcomeToast && (
        <div style={{
          position: 'fixed', bottom: isMobile ? 76 : 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1D4ED8', color: '#fff', borderRadius: 12,
          padding: '12px 20px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(29,78,216,0.35)',
          zIndex: 999, whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)',
          animation: 'fadeSlideUp 0.3s ease',
        }}>
          {welcomeToast}
        </div>
      )}

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

      {isPM ? (
        <PMHome currentUser={currentUser} sprint={sprint} onSendNotification={handleSendNotification} teamMembers={teamMembers} updateTask={updateTask} isMobile={isMobile} />
      ) : currentUser ? (
        <MemberHome currentUser={currentUser} sprint={sprint} moveTask={moveTask} isMobile={isMobile} />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#F4F5F7', color: '#9CA3AF', fontSize: 13 }}>
          <p>왼쪽에서 팀원을 선택하면 내 할 일을 볼 수 있어요</p>
        </div>
      )}
    </div>
  )
}
