import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { useBacklogStore } from '../store/useBacklogStore'
import { useNotificationStore } from '../store/useNotificationStore'
import { useTeamStore } from '../store/useTeamStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useCapacityHistoryStore } from '../store/useCapacityHistoryStore'
import { useIsMobile } from '../hooks/useIsMobile'
import StatusIcon from '../components/StatusIcon'
import {
  deriveAlerts, deriveTrajectory, deriveWorkload,
  deriveMemberNow, deriveMemberNext, deriveMyDeadlines, deriveTeamContext,
} from '../utils/dashboardSelectors'
import { generatePMAdvice, generateMemberAdvice, getDismissedAdviceIds, dismissAdvice } from '../utils/adviceEngine'

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

// 완료율 도넛 링
function DonutRing({ pct, size = 88, stroke = 9, color = '#2563EB' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0F2F5" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="800" fill="#111827">{pct}%</text>
      <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9CA3AF">완료율</text>
    </svg>
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

function timeAgo(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 60) return `${Math.max(1, min)}분 전`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

/* ─────────────────────────────────────────────
   ① 지금 확인이 필요한 항목 — 4개 카드, 0건도 유지
───────────────────────────────────────────── */
function AlertSummaryRow({ alerts, isMobile, onRemind, navigate }) {
  const cards = [
    { key: 'blockers',    icon: 'blocker',    label: '블로커',              count: alerts.blockers.length,       action: '담당자 확인 →',     onClick: () => navigate('/sprint/1/board') },
    { key: 'unassigned',  icon: 'unassigned', label: '미배정',              count: alerts.unassigned.length,     action: '재배정하기 →',      onClick: () => navigate('/sprint/1/board') },
    { key: 'dueSoonOrOver', icon: 'deadline', label: '마감 임박·초과',      count: alerts.dueSoonOrOver.length,  action: '일정 조정 →',       onClick: () => navigate('/sprint/1/board') },
    { key: 'stale',        icon: 'status',    label: '48h+ 미업데이트',     count: alerts.stale.length,          action: '리마인드 보내기 →', onClick: () => onRemind(alerts.stale) },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
      {cards.map(c => {
        const zero = c.count === 0
        return (
          <div key={c.key} style={{ ...card, padding: '13px 15px', background: zero ? '#FAFAFA' : '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <StatusIcon type={c.icon} size={13} style={{ opacity: zero ? 0.4 : 1 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{c.label}</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: zero ? '#C4C9D1' : '#111827', lineHeight: 1 }}>
              {c.count}<span style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', marginLeft: 2 }}>건</span>
            </p>
            {zero ? (
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginTop: 6 }}>없음 ✓</p>
            ) : (
              <button onClick={c.onClick} style={{
                marginTop: 6, padding: 0, border: 'none', background: 'none',
                fontSize: 11, fontWeight: 700, color: '#2563EB', cursor: 'pointer',
              }}>{c.action}</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ② 스프린트 궤도 — 신호등 + 요약 + 번다운, 완료율 도넛
───────────────────────────────────────────── */
const TRAJECTORY_STYLE = {
  safe:   { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', label: 'Safe' },
  warn:   { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', label: 'Warn' },
  danger: { bg: '#FFF5F5', border: '#FECACA', color: '#DC2626', label: 'Danger' },
}

function TrajectoryCard({ trajectory, sprint, tasks }) {
  const s = TRAJECTORY_STYLE[trajectory.status]
  return (
    <div style={{ ...card, padding: '16px 20px', flex: '2 1 420px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 9999,
          background: s.bg, color: s.color, border: `1px solid ${s.border}`,
        }}>{s.label}</span>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>스프린트 궤도</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14, lineHeight: 1.5 }}>{trajectory.summary}</p>
      <BurndownChart tasks={tasks} startDate={sprint.startDate} endDate={sprint.endDate} height={110} />
    </div>
  )
}

function DonutCard({ trajectory, daysLabel }) {
  return (
    <div style={{ ...card, padding: '16px 18px', flex: '1 1 220px', minWidth: 200, display: 'flex', alignItems: 'center', gap: 14 }}>
      <DonutRing pct={trajectory.pct} color={trajectory.pct >= 70 ? '#10B981' : '#2563EB'} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 12, color: '#6B7280' }}>{trajectory.doneCount}/{trajectory.totalCount}개 완료</p>
        <p style={{ fontSize: 12, color: '#6B7280' }}>검토 중 {trajectory.reviewCount}개</p>
        <p style={{ fontSize: 13, fontWeight: 800, color: trajectory.daysLeft <= 3 ? '#EF4444' : '#111827' }}>{daysLabel}</p>
      </div>
    </div>
  )
}

// 번다운 차트 — 실제 날짜·시간 기반
function BurndownChart({ tasks, startDate, endDate, height = 160 }) {
  const totalH = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH  = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimatedHours || 0), 0)

  const start = new Date(startDate.replace(/\./g, '-'))
  const end   = new Date(endDate.replace(/\./g, '-'))
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const totalDays = Math.max(1, Math.round((end - start) / 86400000))
  const elapsed   = Math.min(totalDays, Math.max(0, Math.round((today - start) / 86400000)))

  const W = 500, H = height, PAD_L = 40, PAD_R = 20, PAD_T = 14, PAD_B = 26
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B

  function xOf(day) { return PAD_L + (day / totalDays) * chartW }
  function yOf(h)   { return PAD_T + (1 - h / Math.max(totalH, 1)) * chartH }

  const idealStart = `${xOf(0)},${yOf(totalH)}`
  const idealEnd   = `${xOf(totalDays)},${yOf(0)}`

  const actualPts  = `${xOf(0)},${yOf(totalH)} ${xOf(elapsed)},${yOf(totalH - doneH)}`
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
      {[0, 0.5, 1].map(r => (
        <line key={r} x1={PAD_L} y1={yOf(totalH * r)} x2={W - PAD_R} y2={yOf(totalH * r)} stroke="#F3F4F6" strokeWidth="1"/>
      ))}
      <line x1={idealStart.split(',')[0]} y1={idealStart.split(',')[1]}
            x2={idealEnd.split(',')[0]}   y2={idealEnd.split(',')[1]}
        stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="5,3"/>
      <polyline points={actualPts} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round"/>
      {elapsed < totalDays && ratePerDay > 0 && (
        <polyline points={projPts} fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4"/>
      )}
      <path d={`M${PAD_L},${yOf(totalH)} ${actualPts.split(' ').slice(1).join(' ')} ${xOf(elapsed)},${PAD_T + chartH} ${PAD_L},${PAD_T + chartH}Z`} fill="url(#bluefill)"/>
      <circle cx={todayX} cy={todayY} r="4.5" fill="#2563EB" stroke="white" strokeWidth="2"/>
      <line x1={todayX} y1={PAD_T} x2={todayX} y2={PAD_T + chartH} stroke="#2563EB" strokeWidth="1" strokeDasharray="3,2" opacity="0.3"/>
      <text x={PAD_L}     y={H - 4} fontSize="9" fill="#9CA3AF">시작</text>
      <text x={todayX - 8} y={H - 4} fontSize="9" fill="#2563EB" fontWeight="bold">오늘</text>
      <text x={W - PAD_R - 18} y={H - 4} fontSize="9" fill="#9CA3AF">종료</text>
    </svg>
  )
}

/* ─────────────────────────────────────────────
   ③ AI 조언 — 규칙 기반, 근거+적용/무시 (외부 API 없음)
───────────────────────────────────────────── */
const ADVICE_LABEL = { reassign: '재배정 제안', capacity: '캐파 조정 제안', split: '분할 제안', order: '순서 제안', ready: '시작 가능' }

function AIAdviceCard({ items, onApply, onDismiss }) {
  return (
    <div style={{ ...card, padding: '16px 20px' }}>
      <SectionTitle>AI 조언</SectionTitle>
      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>지금은 조언할 것이 없어요 — 계획이 안정적이에요</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(a => (
            <div key={a.id} style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #DDD6FE', background: '#F5F3FF' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', background: '#fff', border: '1px solid #DDD6FE', padding: '2px 8px', borderRadius: 9999 }}>
                ✦ {ADVICE_LABEL[a.type] || '제안'}
              </span>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginTop: 8 }}>{a.message}</p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{a.evidence}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => onApply(a)} style={{ padding: '5px 14px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer' }}>적용</button>
                <button onClick={() => onDismiss(a.id)} style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: '1px solid #DDD6FE', background: '#fff', color: '#7C3AED', cursor: 'pointer' }}>무시</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ④ 팀원별 워크로드 — 배정h/가용h만, 접속시간·점수 없음
───────────────────────────────────────────── */
const WORKLOAD_STATUS = {
  over:   { label: '과부하', bg: '#FEE2E2', color: '#DC2626' },
  light:  { label: '여유',   bg: '#EFF6FF', color: '#2563EB' },
  normal: { label: '정상',   bg: '#D1FAE5', color: '#059669' },
}

function WorkloadTable({ workload }) {
  return (
    <div style={{ ...card, padding: '16px 20px' }}>
      <SectionTitle>팀원별 워크로드</SectionTitle>
      {workload.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>아직 배정된 태스크가 없어요. 이번 계획 만들기에서 담당자를 배정해보세요.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workload.map(w => {
            const st = WORKLOAD_STATUS[w.status]
            return (
              <div key={w.member.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={w.member.initials} color={w.member.color} size={26} fontSize={10} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{w.member.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: st.bg, color: st.color }}>{st.label}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>{w.assignedH}h / {w.cap}h</span>
                  </div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, w.pct)}%`, background: st.color, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p style={{ fontSize: 10, color: '#C4C9D1', marginTop: 12, borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
        접속 시간·생산성 점수는 표시하지 않습니다
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   간트차트 — CSS grid, 역할별 그룹, 선행 배지, 오늘 세로선
───────────────────────────────────────────── */
function roleGroup(task, teamMembers) {
  if (!task.member) return '미배정'
  const role = teamMembers.find(m => m.name === task.member.name)?.role || ''
  if (role === 'PM') return '기획'
  if (role.includes('디자인')) return '디자인'
  return '개발'
}

function GanttChart({ tasks, startDate, endDate, teamMembers, navigate }) {
  const DAY_W   = 34
  const ROW_H   = 40
  const LABEL_W = 170
  const HDR_H   = 48

  const toD = s => { const d = new Date(s.replace(/\./g, '-')); d.setHours(0,0,0,0); return d }
  const start = toD(startDate)
  const end   = toD(endDate)
  const today = new Date(); today.setHours(0,0,0,0)
  const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1)

  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start.getTime() + i * 86400000)
    return { d, isToday: d.getTime() === today.getTime(), isWeekend: d.getDay() === 0 || d.getDay() === 6 }
  })

  const months = []
  days.forEach(({ d }) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!months.length || months[months.length - 1].key !== key) months.push({ key, label: `${d.getMonth() + 1}월`, count: 1 })
    else months[months.length - 1].count++
  })

  function barProps(task) {
    const s = task.startDate ? toD(task.startDate) : start
    const e = task.dueDate   ? toD(task.dueDate)   : end
    const startOff = Math.max(0, Math.round((s - start) / 86400000))
    const endOff   = Math.min(totalDays, Math.round((e - start) / 86400000) + 1)
    return { left: startOff * DAY_W, width: Math.max(DAY_W, (endOff - startOff) * DAY_W) }
  }

  const todayOff = today >= start && today <= end ? Math.round((today - start) / 86400000) : null
  const STATUS_COLOR = { done: '#9CA3AF', inprogress: '#2563EB', review: '#F59E0B', todo: '#CBD5E1' }
  const totalW = LABEL_W + totalDays * DAY_W

  const stickyLabel = (bg) => ({
    position: 'sticky', left: 0, zIndex: 5,
    width: LABEL_W, minWidth: LABEL_W, flexShrink: 0,
    background: bg, borderRight: '1px solid #E8EAED',
    display: 'flex', alignItems: 'center',
  })

  // 역할별 그룹핑
  const groups = ['기획', '디자인', '개발', '미배정']
    .map(g => ({ label: g, tasks: tasks.filter(t => roleGroup(t, teamMembers) === g) }))
    .filter(g => g.tasks.length > 0)

  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E8EAED' }}>
      <div style={{ minWidth: totalW, display: 'flex', flexDirection: 'column' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', height: HDR_H, borderBottom: '2px solid #E8EAED', background: '#F9FAFB' }}>
          <div style={{ ...stickyLabel('#F9FAFB'), height: HDR_H, flexDirection: 'column', justifyContent: 'flex-end', padding: '0 12px 6px' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF' }}>태스크</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: 24, borderBottom: '1px solid #E8EAED' }}>
              {months.map((m, i) => (
                <div key={i} style={{ width: m.count * DAY_W, flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 8, fontSize: 11, fontWeight: 700, color: '#374151', borderRight: '1px solid #E8EAED' }}>{m.label}</div>
              ))}
            </div>
            <div style={{ display: 'flex', height: 24 }}>
              {days.map(({ d, isToday, isWeekend }, i) => (
                <div key={i} style={{
                  width: DAY_W, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: isToday ? 800 : 400,
                  color: isToday ? '#EF4444' : isWeekend ? '#CBD5E1' : '#64748B',
                  background: isToday ? '#FEF2F2' : 'transparent', borderRight: '1px solid #F1F5F9',
                }}>{d.getDate()}</div>
              ))}
            </div>
          </div>
        </div>

        {/* 역할별 그룹 */}
        {groups.map(group => (
          <div key={group.label}>
            <div style={{ display: 'flex', height: 26, background: '#F4F5F7', borderBottom: '1px solid #E8EAED' }}>
              <div style={{ ...stickyLabel('#F4F5F7'), height: 26, padding: '0 12px' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4B5563' }}>{group.label} · {group.tasks.length}</span>
              </div>
              <div style={{ flex: 1 }} />
            </div>
            {group.tasks.map((task, i) => {
              const color = STATUS_COLOR[task.status] || '#CBD5E1'
              const { left, width } = barProps(task)
              const rowBg = i % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
              const isDone = task.status === 'done'
              const blocked = task.status !== 'done' && task.blocker && tasks.find(b => b.id === task.blocker && b.status !== 'done')
              const blockerTitle = blocked ? tasks.find(b => b.id === task.blocker)?.title : null

              return (
                <div key={task.id} style={{ display: 'flex', height: ROW_H, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ ...stickyLabel(rowBg), height: ROW_H, gap: 8, padding: '0 10px', overflow: 'hidden' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: task.member?.color ?? '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                      {task.member?.initials ?? '?'}
                    </div>
                    <div style={{ overflow: 'hidden', minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, position: 'relative', background: rowBg, overflow: 'hidden' }}>
                    {days.map(({ isToday, isWeekend }, di) => (
                      <div key={di} style={{ position: 'absolute', left: di * DAY_W, top: 0, width: DAY_W, height: '100%', background: isToday ? 'rgba(239,68,68,0.06)' : isWeekend ? 'rgba(0,0,0,0.018)' : 'transparent', borderRight: '1px solid #F1F5F9', zIndex: 0 }}/>
                    ))}
                    {todayOff !== null && (
                      <div style={{ position: 'absolute', left: todayOff * DAY_W + DAY_W / 2 - 1, top: 0, width: 2, height: '100%', background: '#EF4444', opacity: 0.6, zIndex: 2 }}/>
                    )}

                    {blocked && blockerTitle && (
                      <div title={`선행: ${blockerTitle}`} style={{
                        position: 'absolute', left: Math.max(2, left - 96), top: '50%', transform: 'translateY(-50%)',
                        fontSize: 9, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: '1px solid #FECACA',
                        borderRadius: 6, padding: '2px 6px', whiteSpace: 'nowrap', zIndex: 4, maxWidth: 92, overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>◀ 선행: {blockerTitle}</div>
                    )}

                    <button onClick={() => navigate('/sprint/1/board')} title="태스크 상세 보기" style={{
                      position: 'absolute', left: left + 2, top: '50%', transform: 'translateY(-50%)',
                      width: width - 4, height: 22, background: color, border: blocked ? '2px solid #DC2626' : 'none',
                      borderRadius: 6, opacity: isDone ? 0.7 : task.status === 'todo' ? 0.65 : 1, zIndex: 3,
                      display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 6, overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer',
                    }}>
                      {isDone && <span style={{ fontSize: 10, color: '#fff', marginRight: 4 }}>✓</span>}
                      {width > 56 && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, padding: '10px 12px', borderTop: '1px solid #E8EAED', flexWrap: 'wrap', background: '#F9FAFB' }}>
        {[['#9CA3AF','완료'], ['#2563EB','진행 중'], ['#F59E0B','검토 중'], ['#CBD5E1','예정']].map(([c, l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 8, borderRadius: 2, background: c }}/>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{l}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 8, borderRadius: 2, border: '2px solid #DC2626' }}/>
          <span style={{ fontSize: 11, color: '#6B7280' }}>블로커</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 2, height: 12, background: '#EF4444', opacity: 0.6 }}/>
          <span style={{ fontSize: 11, color: '#6B7280' }}>오늘</span>
        </div>
      </div>
    </div>
  )
}

// 달력 뷰 — 마감일 + 회의/일정
function CalendarView({ tasks, isMobile }) {
  const { events, addEvent, removeEvent } = useScheduleStore()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [viewDate, setViewDate] = useState(new Date(today))
  const [selectedDate, setSelectedDate] = useState(fmt(today))
  const [newEventTitle, setNewEventTitle] = useState('')

  function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const tasksByDate = {}
  tasks.forEach(t => {
    if (!t.dueDate) return
    const key = t.dueDate
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(t)
  })
  const eventsByDate = {}
  events.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  })

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const STATUS_DOT = { done: '#10B981', inprogress: '#2563EB', review: '#F59E0B', todo: '#9CA3AF' }
  const DOT_SHAPE = { done: {}, inprogress: {}, review: { square: true }, todo: { ring: true } }

  const selectedTasks  = tasksByDate[selectedDate] || []
  const selectedEvents = eventsByDate[selectedDate] || []

  return (
    <div style={{ ...card, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionTitle>일정 달력</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
            style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #E8EAED', background: '#fff', cursor: 'pointer', color: '#6B7280' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 88, textAlign: 'center' }}>{year}년 {month + 1}월</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
            style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #E8EAED', background: '#fff', cursor: 'pointer', color: '#6B7280' }}>›</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 320px', minWidth: 280 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9CA3AF', padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const dayTasks = tasksByDate[dateStr] || []
              const dayEvents = eventsByDate[dateStr] || []
              const isToday = fmt(today) === dateStr
              const isSelected = selectedDate === dateStr
              return (
                <button key={dateStr} onClick={() => setSelectedDate(dateStr)} style={{
                  minHeight: isMobile ? 44 : 58, padding: '4px 5px', borderRadius: 10, cursor: 'pointer',
                  border: isSelected ? '1.5px solid #2563EB' : isToday ? '1.5px solid #BFDBFE' : '1px solid #F3F4F6',
                  background: isSelected ? '#EFF6FF' : '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, textAlign: 'left',
                }}>
                  <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? '#2563EB' : '#374151' }}>{d}</span>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    {dayTasks.slice(0, 3).map(t => {
                      const shape = DOT_SHAPE[t.status] || DOT_SHAPE.todo
                      return (
                        <span key={t.id} title={t.title} style={{
                          width: 6, height: 6, flexShrink: 0,
                          borderRadius: shape.square ? 1 : '50%',
                          background: shape.ring ? 'transparent' : (STATUS_DOT[t.status] || '#9CA3AF'),
                          border: shape.ring ? `1.5px solid ${STATUS_DOT[t.status] || '#9CA3AF'}` : 'none',
                        }} />
                      )
                    })}
                    {dayEvents.length > 0 && <StatusIcon type="event" size={9} />}
                  </div>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { key: 'todo',       label: '예정' },
              { key: 'inprogress', label: '진행중' },
              { key: 'review',     label: '검토중' },
              { key: 'done',       label: '완료' },
            ].map(({ key, label }) => {
              const shape = DOT_SHAPE[key]
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    width: 7, height: 7, flexShrink: 0,
                    borderRadius: shape.square ? 1 : '50%',
                    background: shape.ring ? 'transparent' : STATUS_DOT[key],
                    border: shape.ring ? `1.5px solid ${STATUS_DOT[key]}` : 'none',
                  }} />
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ flex: '1 1 220px', minWidth: 220, borderLeft: isMobile ? 'none' : '1px solid #F3F4F6', paddingLeft: isMobile ? 0 : 16, borderTop: isMobile ? '1px solid #F3F4F6' : 'none', paddingTop: isMobile ? 12 : 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>{selectedDate}</p>

          {selectedTasks.length === 0 && selectedEvents.length === 0 && (
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>마감 업무나 일정이 없어요</p>
          )}

          {selectedTasks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {selectedTasks.map(t => {
                const shape = DOT_SHAPE[t.status] || DOT_SHAPE.todo
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: '#F9FAFB' }}>
                    <span style={{
                      width: 7, height: 7, flexShrink: 0,
                      borderRadius: shape.square ? 1 : '50%',
                      background: shape.ring ? 'transparent' : (STATUS_DOT[t.status] || '#9CA3AF'),
                      border: shape.ring ? `1.5px solid ${STATUS_DOT[t.status] || '#9CA3AF'}` : 'none',
                    }} />
                    <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{t.title}</span>
                    {t.member && <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{t.member.name}</span>}
                  </div>
                )
              })}
            </div>
          )}

          {selectedEvents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {selectedEvents.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: '#F5F3FF' }}>
                  <StatusIcon type="event" size={13} />
                  <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{e.title}</span>
                  <button onClick={() => removeEvent(e.id)} style={{ fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <input value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { addEvent(selectedDate, newEventTitle); setNewEventTitle('') } }}
              placeholder="회의/일정 추가..."
              style={{ flex: 1, fontSize: 12, padding: '7px 10px', borderRadius: 8, border: '1px solid #E8EAED', outline: 'none' }} />
            <button onClick={() => { addEvent(selectedDate, newEventTitle); setNewEventTitle('') }}
              style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer' }}>추가</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PM 홈 — ① 확인 필요 → ② 궤도 → ③ AI 조언 → ④ 워크로드
───────────────────────────────────────────── */
function PMHome({ currentUser, sprint, onSendNotification, teamMembers = [], updateTask, updateMember, getMemberStats, pushNotif, isMobile }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('개요')
  const [sendModal, setSendModal] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')
  const [dismissed, setDismissed] = useState(getDismissedAdviceIds())

  const tasks = sprint.tasks
  const alerts = deriveAlerts(tasks)
  const trajectory = deriveTrajectory(sprint, tasks)
  const workload = deriveWorkload(tasks, teamMembers)
  const daysLabel = trajectory.daysLeft > 0 ? `D-${trajectory.daysLeft}` : trajectory.daysLeft === 0 ? 'D-Day' : `D+${Math.abs(trajectory.daysLeft)}`

  const advice = generatePMAdvice({ tasks, teamMembers, getMemberStats }).filter(a => !dismissed.includes(a.id))

  function handleRemind(staleTasks) {
    staleTasks.forEach(t => {
      if (!t.member) return
      pushNotif({ type: 'status', title: `업데이트 리마인드 — ${t.title}`, body: `${t.member.name}님, "${t.title}" 진행 상황을 업데이트해주세요. 48시간 넘게 변경이 없어요.` })
    })
  }

  function handleApplyAdvice(a) {
    if (!window.confirm(`${a.message}\n\n이 제안을 적용할까요?`)) return
    if (a.type === 'reassign') {
      const target = teamMembers.find(m => m.name === a.action.toMemberName)
      if (target) updateTask(a.action.taskId, { member: { id: target.id, name: target.name, color: target.color, initials: target.initials } })
    } else if (a.type === 'capacity') {
      const cur = teamMembers.find(m => m.id === a.action.memberId)
      if (cur) {
        const adjusted = Math.max(0, Math.round(cur.capacity * (1 - a.action.suggestedRate / 100) / 4) * 4)
        updateMember(a.action.memberId, { capacity: adjusted })
      }
    }
    dismissAdvice(a.id)
    setDismissed(getDismissedAdviceIds())
  }

  function handleDismissAdvice(id) {
    dismissAdvice(id)
    setDismissed(getDismissedAdviceIds())
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: isMobile ? '14px 16px' : '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {sendModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setSendModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 440, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 60px rgba(17,24,39,0.2)' }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>📢 팀에게 알림 보내기</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>모든 팀원의 알림함에 전달됩니다</p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: '#F4F5F7', border: '1px solid #E8EAED' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>이번 계획 현황 자동 요약</p>
              <p style={{ fontSize: 12, color: '#374151', lineHeight: '18px' }}>
                📊 {sprint.name} 현황: 완료 {trajectory.doneCount}/{trajectory.totalCount}개 ({trajectory.pct}%) · 남은 기간 {trajectory.daysLeft}일
                {alerts.blockers.length > 0 ? ` · 블로커 ${alerts.blockers.length}건` : ''}
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
                const summary = `📊 ${sprint.name} 현황: 완료 ${trajectory.doneCount}/${trajectory.totalCount}개 (${trajectory.pct}%) · 남은 ${trajectory.daysLeft}일${alerts.blockers.length > 0 ? ` · 블로커 ${alerts.blockers.length}건` : ''}`
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, background: '#E8EAED', borderRadius: 10, padding: 3 }}>
          {['개요', '간트차트', '달력'].map(tab => (
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

      {activeTab === '간트차트' && (
        <div style={{ ...card, padding: '16px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>전체 태스크 간트 뷰</p>
          {tasks.length === 0
            ? <p style={{ fontSize: 13, color: '#9CA3AF' }}>아직 태스크가 없어요. 이번 계획 만들기에서 태스크를 배정해보세요.</p>
            : <GanttChart tasks={tasks} startDate={sprint.startDate} endDate={sprint.endDate} teamMembers={teamMembers} navigate={navigate} />
          }
        </div>
      )}

      {activeTab === '달력' && <CalendarView tasks={tasks} isMobile={isMobile} />}

      {activeTab === '개요' && <>
        {/* ① 지금 확인이 필요한 항목 */}
        <AlertSummaryRow alerts={alerts} isMobile={isMobile} onRemind={handleRemind} navigate={navigate} />

        {/* ② 스프린트 궤도 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <TrajectoryCard trajectory={trajectory} sprint={sprint} tasks={tasks} />
          <DonutCard trajectory={trajectory} daysLabel={daysLabel} />
        </div>

        {/* ③ AI 조언 */}
        <AIAdviceCard items={advice} onApply={handleApplyAdvice} onDismiss={handleDismissAdvice} />

        {/* ④ 팀원별 워크로드 */}
        <WorkloadTable workload={workload} />
      </>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   팀원 홈 — ① 지금 진행 중 → ② 다음 할 일 → ③ 마감+팀맥락 → AI 조언 → 알림
───────────────────────────────────────────── */
function MemberHome({ currentUser, sprint, moveTask, updateTask, updateNote, isMobile, onRequestReview }) {
  const { notifications } = useNotificationStore()
  const [dismissed, setDismissed] = useState(getDismissedAdviceIds())
  const tasks = sprint.tasks

  const { now: nowTask } = deriveMemberNow(tasks, currentUser)
  const { next: nextTask, isReady, blockerTitle, preview } = deriveMemberNext(tasks, currentUser)
  const myDeadlines = deriveMyDeadlines(tasks, currentUser)
  const teamContext = deriveTeamContext(tasks, currentUser, sprint)
  const advice = generateMemberAdvice({ tasks, currentUser }).filter(a => !dismissed.includes(a.id))

  function handleApplyAdvice(a) {
    if (!window.confirm(`${a.message}\n\n적용할까요?`)) return
    if (a.type === 'ready') moveTask(a.action.taskId, 'inprogress')
    dismissAdvice(a.id)
    setDismissed(getDismissedAdviceIds())
  }
  function handleDismissAdvice(id) {
    dismissAdvice(id)
    setDismissed(getDismissedAdviceIds())
  }

  function handleRegisterOutput(task) {
    const url = window.prompt('산출물 링크(URL)를 입력해주세요', task.outputLink || '')
    if (url !== null) updateTask(task.id, { outputLink: url })
  }
  function handleReportBlocked(task) {
    onRequestReview?.(task, true)
  }

  const dueChip = t => {
    if (!t.dueDate) return null
    const days = Math.ceil((new Date(t.dueDate) - new Date()) / 86400000)
    const label = days > 0 ? `D-${days}` : days === 0 ? 'D-Day' : `D+${Math.abs(days)}`
    return { label, danger: days <= 1 }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: isMobile ? '14px 16px' : '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ① 지금 진행 중 */}
      <div style={{ ...card, padding: '18px 20px' }}>
        <SectionTitle>지금 진행 중</SectionTitle>
        {!nowTask ? (
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>진행 중인 업무가 없어요. 아래 다음 할 일에서 시작해보세요.</p>
        ) : (() => {
          const chip = dueChip(nowTask)
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', flex: 1 }}>{nowTask.title}</p>
                {chip && (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 9999, background: chip.danger ? '#FEE2E2' : '#EFF6FF', color: chip.danger ? '#DC2626' : '#2563EB' }}>{chip.label}</span>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
                예상 {nowTask.estimatedHours || 0}h{nowTask.note ? ` · ${nowTask.note}` : ''}
              </p>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>진행률</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{nowTask.progress || 0}%</span>
                </div>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${nowTask.progress || 0}%`, background: currentUser.color || '#2563EB', borderRadius: 3 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => handleRegisterOutput(nowTask)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', cursor: 'pointer' }}>산출물 링크 등록</button>
                <button onClick={() => handleReportBlocked(nowTask)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer' }}>막힘 알리기</button>
                <button onClick={() => { moveTask(nowTask.id, 'review'); onRequestReview?.(nowTask) }} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #A7F3D0', background: '#D1FAE5', color: '#059669', cursor: 'pointer' }}>검토 요청</button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ② 다음 할 일 */}
      <div style={{ ...card, padding: '16px 20px' }}>
        <SectionTitle>다음 할 일</SectionTitle>
        {!nextTask ? (
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>준비된 업무가 없어요.</p>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', flex: 1 }}>{nextTask.title}</p>
              {nextTask.estimatedHours > 0 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{nextTask.estimatedHours}h</span>}
            </div>
            <div style={{ marginBottom: 10 }}>
              {isReady ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 9px', borderRadius: 9999 }}>선행 업무 완료 — 바로 시작 가능</span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: '#F3F4F6', padding: '2px 9px', borderRadius: 9999 }}>선행 대기 중: {blockerTitle || '확인 필요'}</span>
              )}
            </div>
            {isReady && (
              <button onClick={() => moveTask(nextTask.id, 'inprogress')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', cursor: 'pointer' }}>시작하기</button>
            )}
            {preview && (
              <p style={{ fontSize: 11, color: '#C4C9D1', marginTop: 10 }}>다음: {preview.title}</p>
            )}
          </div>
        )}
      </div>

      {/* ③ 내 마감 일정 + 팀 맥락 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        <div style={{ ...card, padding: '16px 20px' }}>
          <SectionTitle>내 마감 일정</SectionTitle>
          {myDeadlines.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>다가오는 마감이 없어요.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {myDeadlines.map(t => {
                const chip = dueChip(t)
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#F9FAFB' }}>
                    <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{t.title}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{t.dueDate}</span>
                    {chip && <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 9999, background: chip.danger ? '#FEE2E2' : '#EFF6FF', color: chip.danger ? '#DC2626' : '#2563EB' }}>{chip.label}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ ...card, padding: '16px 20px' }}>
          <SectionTitle>팀 맥락</SectionTitle>
          <p style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>
            {teamContext.relevantBlocker
              ? `"${teamContext.relevantBlocker.title}"의 선행이 막혀 있어요`
              : '팀 블로커는 내 업무와 무관해요'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>팀 전체 진행률</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>{teamContext.teamPct}%</span>
          </div>
          <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${teamContext.teamPct}%`, background: '#2563EB', borderRadius: 3 }} />
          </div>
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>남은 기간 {teamContext.daysLeft > 0 ? `${teamContext.daysLeft}일` : 'D-Day'}</p>
          {teamContext.iAmBlocking.length > 0 && (
            <p style={{ fontSize: 11, color: '#D97706', marginTop: 8, fontWeight: 600 }}>내 업무가 끝나야 시작하는 후속 업무 {teamContext.iAmBlocking.length}건이 있어요</p>
          )}
        </div>
      </div>

      {/* AI 조언 */}
      <AIAdviceCard items={advice} onApply={handleApplyAdvice} onDismiss={handleDismissAdvice} />

      {/* 알림 피드 */}
      <div style={{ ...card, padding: '16px 20px' }}>
        <SectionTitle>알림</SectionTitle>
        {notifications.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>아직 알림이 없어요.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: n.read ? '#fff' : '#F9FAFB', border: '1px solid #F3F4F6' }}>
                <StatusIcon type={n.type} size={14} />
                <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{n.title}</span>
                <span style={{ fontSize: 10, color: '#C4C9D1', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   메인 export
───────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { sprint, closeSprint, moveTask, updateTask, updateNote } = useSprintStore()
  const { recordSprint, getMemberStats } = useCapacityHistoryStore()
  const { currentUser, can }              = useAuthStore()
  const { add: addToBacklog }             = useBacklogStore()
  const { push: pushNotif }               = useNotificationStore()
  const { settings, members: teamMembers, updateMember } = useTeamStore()
  const [closeModal, setCloseModal]       = useState(false)
  const [welcomeToast, setWelcomeToast]   = useState(null)

  useEffect(() => {
    const flag = sessionStorage.getItem('onboarding_done')
    if (flag) {
      sessionStorage.removeItem('onboarding_done')
      const pmMessage = sprint?.status === 'active'
        ? '팀이 준비됐어요! 진행 중인 계획을 확인해보세요 🚀'
        : '팀이 준비됐어요! 팀원을 초대하고 첫 계획을 시작해보세요 🚀'
      setWelcomeToast(flag === 'pm' ? pmMessage : '환영해요! 담당 태스크를 확인해보세요 →')
      setTimeout(() => setWelcomeToast(null), 4500)
    }
  }, [])

  function handleSendNotification(summary, extra) {
    pushNotif({ type: 'announce', title: 'PM 공지', body: summary + (extra ? '\n' + extra : '') })
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
    recordSprint(sprint.name, sprint.tasks)
    const incomplete = closeSprint()
    incomplete.forEach(t => {
      const memberNote = t.member?.name ? ` · ${t.member.name} 담당 · ${t.progress || 0}% 진행` : ''
      addToBacklog({
        title: t.title, priority: t.priority, estimatedHours: t.estimatedHours || 0,
        desc: `[${sprint.name}에서 이월${memberNote}]`, category: '기능', stage: 'MVP',
      }, currentUser?.id || null)
    })
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
              {sprint?.status === 'completed' ? '이번 계획이 종료됐어요. 회고 후 새 계획을 시작해보세요.' : '이번 계획 만들기에서 계획을 만들어보세요.'}
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
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>이번 계획을 종료할까요?</p>
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
          }}>계획 종료</button>
        )}
      </Topbar>

      {isPM ? (
        <PMHome currentUser={currentUser} sprint={sprint} onSendNotification={handleSendNotification}
          teamMembers={teamMembers} updateTask={updateTask} updateMember={updateMember}
          getMemberStats={getMemberStats} pushNotif={pushNotif} isMobile={isMobile} />
      ) : currentUser ? (
        <MemberHome currentUser={currentUser} sprint={sprint} moveTask={moveTask} updateTask={updateTask} updateNote={updateNote} isMobile={isMobile}
          onRequestReview={(task, isBlockedReport) => pushNotif({
            type: isBlockedReport ? 'blocker' : 'review',
            title: isBlockedReport ? `막힘 알림 — ${task.title}` : `검토 요청 — ${task.title}`,
            body: isBlockedReport
              ? `${currentUser?.name}님이 "${task.title}"에서 막혔다고 알렸어요. 확인해주세요.`
              : `${currentUser?.name}님이 "${task.title}" 검토를 요청했어요. 진행 현황판에서 승인/반려할 수 있어요.`,
          })} />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#F4F5F7', color: '#9CA3AF', fontSize: 13 }}>
          <p>왼쪽에서 팀원을 선택하면 내 할 일을 볼 수 있어요</p>
        </div>
      )}
    </div>
  )
}
