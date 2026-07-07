import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore } from '../store/useBacklogStore'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTeamStore } from '../store/useTeamStore'
import { useSprintPlanStore } from '../store/useSprintPlanStore'
import { useCapacityHistoryStore } from '../store/useCapacityHistoryStore'
import { callClaude } from '../utils/claude'
import TaskDetailModal from '../components/TaskDetailModal'

const PRIORITY_STYLE = {
  Must:    { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should:  { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:   { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't": { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}


const FOCUS_CHIPS = ['AI 기능', '사용자 피드백', '성능', '기술부채', '신규 기능', '버그 수정', '리팩토링']

function countDays(start, end, weekdayOnly) {
  if (!start || !end) return 0
  if (!weekdayOnly) return Math.max(0, Math.round((new Date(end) - new Date(start)) / 864e5) + 1)
  let count = 0
  const d = new Date(start)
  const e = new Date(end)
  while (d <= e) { const day = d.getDay(); if (day !== 0 && day !== 6) count++; d.setDate(d.getDate() + 1) }
  return count
}

const TASK_META = {
  '소셜 로그인 (구글)':    { reason: '모든 기능의 진입 전제 — 인증 없이 팀·백로그 모두 불가',      week: 1, memberId: 'a' },
  '팀 생성 및 초대':       { reason: '백로그·AI 기능이 팀 컨텍스트 필요. 1주차 필수 선행',        week: 1, memberId: 'a' },
  '전체 할 일 CRUD':       { reason: 'AI 계획 초안의 입력 데이터 소스. 이것 없으면 AI 동작 불가', week: 1, memberId: 'b' },
  '백로그 CRUD':           { reason: 'AI 계획 초안의 입력 데이터 소스. 이것 없으면 AI 동작 불가', week: 1, memberId: 'b' },
  'Capacity 입력':         { reason: 'AI 배분 알고리즘 핵심 입력값 — 없으면 초과 배정 위험',      week: 1, memberId: 'b' },
  'AI 계획 초안 알고리즘': { reason: 'SprintAI 핵심 차별점. 2주차 배정은 1주차 인프라 완료 전제', week: 2, memberId: 'c' },
  'AI 이번 계획 만들기':   { reason: 'SprintAI 핵심 차별점. 2주차 배정은 1주차 인프라 완료 전제', week: 2, memberId: 'c' },
  'AI 태스크 분해기':      { reason: '에픽 → 태스크 자동 분해. AI 계획 초안 완성 후 연동',       week: 2, memberId: 'c' },
  '칸반 보드':             { reason: '이번 계획 실행 필수 인터페이스 — 배정 완료 후 착수 가능',   week: 2, memberId: 'b' },
  '스프린트 대시보드':     { reason: 'PM 모니터링 화면 — 데이터 흐름이 완성된 2주차에 배정',     week: 2, memberId: 'd' },
  '대시보드':              { reason: 'PM 모니터링 화면 — 데이터 흐름이 완성된 2주차에 배정',     week: 2, memberId: 'd' },
}

function buildResult(selectedItems, meta, teamMembers, suggestedMap = {}) {
  const tasks = selectedItems.map(item => {
    const m = TASK_META[item.title] || { reason: '직무 분석 기반 자동 배정', week: 2, memberId: null }
    // 우선순위: 직접 배정된 assignees → suggestedMap 추천 → TASK_META 기본값
    const directMembers = (item.assignees || []).map(id => teamMembers.find(x => x.id === id)).filter(Boolean)
    const suggested = suggestedMap[item.id] || []
    const fallbackMember = m.memberId ? teamMembers.find(x => x.id === m.memberId) : null
    const members = directMembers.length > 0 ? directMembers
      : suggested.length > 0 ? [suggested[0]]
      : fallbackMember ? [fallbackMember] : []
    return { ...item, _id: item.id, week: m.week, reason: m.reason, members }
  })
  const goalNote = meta?.goal ? `"${meta.goal}" 목표에 맞춰 ` : ''
  return {
    confidence: 87,
    summary: `${goalNote}팀 Capacity와 의존성을 분석해 인증-팀 기반을 1주차에, AI 핵심 기능을 2주차에 배정했습니다.`,
    week1: tasks.filter(t => t.week === 1),
    week2: tasks.filter(t => t.week === 2),
  }
}

const card = { background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 16, boxShadow: '0 1px 2px rgba(17,24,39,0.04)' }
const btnPrimary   = { padding: '0 20px', height: 40, borderRadius: 12, border: 'none', background: '#2563EB', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const btnSecondary = { ...btnPrimary, background: '#DBEAFE', color: '#1D4ED8' }
const btnTertiary  = { ...btnPrimary, background: '#F4F5F7', color: '#1F2937', border: '1px solid #E8EAED' }
const inputStyle   = { width: '100%', padding: '10px 12px', border: '1px solid #E8EAED', borderRadius: 10, fontSize: 13, color: '#1F2937', outline: 'none', boxSizing: 'border-box', background: '#F9FAFB' }

// 스프린트 기본정보 입력 모달
function SprintMetaModal({ onConfirm, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const twoWeeks = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)
  const [meta, setMeta] = useState({ name: 'Sprint 2', startDate: today, endDate: twoWeeks, goal: '', focus: [] })

  function toggleFocus(chip) {
    setMeta(p => ({ ...p, focus: p.focus.includes(chip) ? p.focus.filter(f => f !== chip) : [...p.focus, chip] }))
  }

  const days = Math.round((new Date(meta.endDate) - new Date(meta.startDate)) / 864e5) + 1

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...card, width: 480, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>이번 계획 기본 정보</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>AI가 계획 초안을 만들 때 활용해요</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 이름 */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>이번 계획 이름</label>
            <input style={inputStyle} value={meta.name} onChange={e => setMeta(p => ({ ...p, name: e.target.value }))} placeholder="예: Sprint 2 — 결제 기능" />
          </div>

          {/* 기간 */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              기간
              {days > 0 && <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 8 }}>{days}일</span>}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="date" style={{ ...inputStyle, flex: 1 }} value={meta.startDate}
                onChange={e => setMeta(p => ({ ...p, startDate: e.target.value }))} />
              <span style={{ color: '#9CA3AF', flexShrink: 0 }}>→</span>
              <input type="date" style={{ ...inputStyle, flex: 1 }} value={meta.endDate}
                onChange={e => setMeta(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>

          {/* 목표 */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>이번 계획 목표 <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(선택)</span></label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: 'inherit', lineHeight: 1.6 }}
              value={meta.goal} onChange={e => setMeta(p => ({ ...p, goal: e.target.value }))}
              placeholder="예: 핵심 AI 기능 MVP를 완성해 내부 베타 테스트를 시작한다" />
          </div>

          {/* 포커스 키워드 */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>팀 포커스 <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(선택, 복수)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {FOCUS_CHIPS.map(chip => {
                const on = meta.focus.includes(chip)
                return (
                  <button key={chip} onClick={() => toggleFocus(chip)} style={{
                    padding: '5px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${on ? '#2563EB' : '#E8EAED'}`,
                    background: on ? '#EFF6FF' : '#F9FAFB',
                    color: on ? '#2563EB' : '#6B7280',
                  }}>{chip}</button>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <button onClick={onClose} style={btnTertiary}>취소</button>
          <button onClick={() => onConfirm(meta)} disabled={!meta.name.trim()}
            style={{ ...btnPrimary, opacity: meta.name.trim() ? 1 : 0.4 }}>
            AI 계획 초안 만들기
          </button>
        </div>
      </div>
    </div>
  )
}

function MemberPicker({ selected, onChange, members }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)

  function toggle() {
    if (pos) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    const dropW = 180
    const left = Math.min(r.left, window.innerWidth - dropW - 8)
    setPos({ top: r.bottom + 6, left: Math.max(8, left) })
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={btnRef} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={toggle}>
        <div style={{ display: 'flex' }}>
          {selected.map((m, i) => (
            <div key={m.id} title={m.name} style={{
              width: 22, height: 22, borderRadius: '50%', background: m.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#fff',
              border: '2px solid #fff', marginLeft: i > 0 ? -6 : 0,
            }}>{m.initials}</div>
          ))}
        </div>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>▼</span>
      </div>
      {pos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setPos(null)} />
          <div style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 99,
            background: '#fff', border: '1px solid #E8EAED', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(17,24,39,0.14)', padding: 6, minWidth: 170,
          }}>
            {(members || []).map(m => {
              const checked = selected.some(s => s.id === m.id)
              return (
                <div key={m.id} onClick={() => onChange(checked ? selected.filter(s => s.id !== m.id) : [...selected, m])}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', background: checked ? '#EFF6FF' : 'transparent' }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#F4F5F7' }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = checked ? '#EFF6FF' : 'transparent' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: checked ? 'none' : '1.5px solid #D1D5DB', background: checked ? '#2563EB' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{m.initials}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{m.role}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// 태스크별 경고 계산
function getTaskAlerts(task, allDraftTasks, capacityMap) {
  const alerts = []
  if (!task.members || task.members.length === 0) {
    alerts.push({ level: 'danger', icon: '👤', label: '담당자 미배정' })
  }
  if (!task.estimatedHours || Number(task.estimatedHours) === 0) {
    alerts.push({ level: 'warn', icon: '⏱', label: '예상 시간 없음' })
  }
  if (Number(task.estimatedHours) > 20) {
    alerts.push({ level: 'info', icon: '✂️', label: '분할 권장 (20h+)' })
  }
  // 담당자 총 배정 시간이 가용 시간 초과
  task.members?.forEach(m => {
    const totalAssigned = allDraftTasks
      .filter(t => t.members?.some(mb => mb.id === m.id))
      .reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0)
    const cap = capacityMap[m.id]
    if (cap !== undefined && totalAssigned > cap) {
      alerts.push({ level: 'danger', icon: '⚡', label: `${m.name} 과부하 (${totalAssigned}시간 > ${cap}시간)` })
    }
  })
  return alerts
}

function AlertBadge({ level, icon, label }) {
  const s = {
    danger: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
    warn:   { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
    info:   { bg: '#DBEAFE', color: '#2563EB', border: '#BFDBFE' },
  }[level]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, flexShrink: 0 }}>
      {icon} {label}
    </span>
  )
}

function ReviewTaskCard({ task, onUpdate, onDelete, onMoveWeek, allDraftTasks, capacityMap, teamMembers }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: task.title, estimatedHours: task.estimatedHours, priority: task.priority })
  const [showMovePreview, setShowMovePreview] = useState(false)

  const alerts = getTaskAlerts(task, allDraftTasks, capacityMap)

  function saveEdit() {
    onUpdate({ ...task, ...draft, estimatedHours: Number(draft.estimatedHours) })
    setEditing(false)
  }

  // 이동 후 워크로드 미리보기 계산
  function getMovePreview() {
    const targetWeek = task.week === 1 ? 2 : 1
    const label = targetWeek === 2 ? '2주차로 이동' : '1주차로 이동'
    // 이동하면 이 태스크의 담당자 workload가 바뀌는지 보여줌
    const member = task.members?.[0]
    if (!member) return { label, memberName: null, change: null }
    const currentH = allDraftTasks.filter(t => t.members?.some(mb => mb.id === member.id)).reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0)
    // 이동해도 총 배정량은 안 바뀜 (같은 사람 담당 유지). 단, 주차별 분포 보여줌
    const week1H = allDraftTasks.filter(t => t.week === 1 && t.members?.some(mb => mb.id === member.id)).reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0)
    const week2H = allDraftTasks.filter(t => t.week === 2 && t.members?.some(mb => mb.id === member.id)).reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0)
    const h = Number(task.estimatedHours) || 0
    const newWeek1H = task.week === 1 ? week1H - h : week1H + h
    const newWeek2H = task.week === 1 ? week2H + h : week2H - h
    return { label, memberName: member.name, week1H, week2H, newWeek1H, newWeek2H, h }
  }

  const movePreview = getMovePreview()
  const hasAlerts = alerts.length > 0

  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${hasAlerts ? '#FDE68A' : '#E8EAED'}`, background: hasAlerts ? '#FFFDF5' : '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
            style={{ fontSize: 13, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: '1px solid #BFDBFE', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={draft.priority} onChange={e => setDraft(p => ({ ...p, priority: e.target.value }))}
              style={{ flex: 1, fontSize: 12, padding: '5px 8px', borderRadius: 8, border: '1px solid #E8EAED', outline: 'none' }}>
              {['Must', 'Should', 'Could', "Won't"].map(p => <option key={p}>{p}</option>)}
            </select>
            <input type="number" value={draft.estimatedHours} min={0.5} max={200} step={0.5}
              onChange={e => setDraft(p => ({ ...p, estimatedHours: e.target.value }))}
              style={{ width: 72, fontSize: 12, padding: '5px 8px', borderRadius: 8, border: '1px solid #E8EAED', outline: 'none' }} />
            <span style={{ alignSelf: 'center', fontSize: 12, color: '#9CA3AF' }}>시간</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={saveEdit} style={{ ...btnPrimary, height: 30, fontSize: 12, padding: '0 12px' }}>저장</button>
            <button onClick={() => setEditing(false)} style={{ ...btnTertiary, height: 30, fontSize: 12, padding: '0 12px' }}>취소</button>
          </div>
        </div>
      ) : (
        <>
          {/* 확인 필요 — 상세는 상단 요약 카드에서 확인 */}
          {alerts.length > 0 && (
            <span style={{ alignSelf: 'flex-start', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}>
              ⚠️ 확인 필요 {alerts.length}개
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#111827' }}>{task.title}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: PRIORITY_STYLE[task.priority]?.bg, color: PRIORITY_STYLE[task.priority]?.color, border: `1px solid ${PRIORITY_STYLE[task.priority]?.border}` }}>{task.priority}</span>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#F3F4F6', color: '#6B7280', padding: '2px 8px', borderRadius: 9999 }}>{task.estimatedHours}시간</span>
          </div>

          {/* AI 추천 이유 */}
          {task.reason && (
            <div style={{ display: 'flex', gap: 6, padding: '7px 10px', borderRadius: 8, background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: 11, color: '#0369A1', lineHeight: 1.5 }}>{task.reason}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            <MemberPicker selected={task.members} onChange={m => onUpdate({ ...task, members: m })} members={teamMembers} />
            <div style={{ display: 'flex', gap: 4 }}>
              {/* 이동 버튼 + 미리보기 */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMovePreview(p => !p)}
                  style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #E8EAED', background: showMovePreview ? '#EFF6FF' : '#F9FAFB', cursor: 'pointer', color: '#6B7280' }}>
                  {task.week === 1 ? '→ 2주' : '← 1주'} 미리보기
                </button>
                {showMovePreview && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowMovePreview(false)} />
                    <div style={{
                      position: 'absolute', bottom: '110%', right: 0, zIndex: 99,
                      background: '#fff', border: '1px solid #E8EAED', borderRadius: 12,
                      boxShadow: '0 8px 24px rgba(17,24,39,0.14)', padding: '14px 16px', minWidth: 220,
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 10 }}>{movePreview.label} 하면?</p>
                      {movePreview.memberName ? (
                        <>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>{movePreview.memberName} 주차별 배정 변화</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                              { label: '1주차', before: movePreview.week1H, after: movePreview.newWeek1H },
                              { label: '2주차', before: movePreview.week2H, after: movePreview.newWeek2H },
                            ].map(({ label, before, after }) => (
                              <div key={label} style={{ padding: '8px 10px', borderRadius: 8, background: '#F4F5F7', textAlign: 'center' }}>
                                <p style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>{label}</p>
                                <p style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>{before}시간</p>
                                <p style={{ fontSize: 14, fontWeight: 700, color: after > before ? '#DC2626' : '#059669' }}>→ {after}시간</p>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => { onMoveWeek(task); setShowMovePreview(false) }}
                            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', height: 32, fontSize: 12, marginTop: 10, borderRadius: 8 }}>
                            이동 확정
                          </button>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>담당자를 배정하면 더 정확한 미리보기가 가능해요</p>
                          <button onClick={() => { onMoveWeek(task); setShowMovePreview(false) }}
                            style={{ ...btnPrimary, width: '100%', justifyContent: 'center', height: 32, fontSize: 12, borderRadius: 8 }}>
                            그냥 이동
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setEditing(true)} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #E8EAED', background: '#F9FAFB', cursor: 'pointer', color: '#2563EB' }}>수정</button>
              <button onClick={() => onDelete(task._id)} style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>삭제</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const PRIORITY_OPTIONS = ['Must', 'Should', 'Could', "Won't"]

function PlanTaskCard({ item, recommended, members, onRemove, onSave, onDetail, onAccept, onDismiss, onToggleAssignee }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: item.title, estimatedHours: item.estimatedHours, priority: item.priority })
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)
  const ps = PRIORITY_STYLE_BUILDER[item.priority] || PRIORITY_STYLE_BUILDER["Won't"]
  const assignedMembers = (item.assignees || []).map(id => members.find(m => m.id === id)).filter(Boolean)

  const isUrgent = (() => {
    if (!item.dueDate) return false
    const today = new Date(); today.setHours(0,0,0,0)
    const diff = Math.ceil((new Date(item.dueDate) - today) / 864e5)
    return diff >= 0 && diff <= 7
  })()

  function save() {
    onSave({ title: draft.title, estimatedHours: Number(draft.estimatedHours), priority: draft.priority })
    setEditing(false)
  }

  const borderColor = recommended.length > 0 ? '#DDD6FE' : isUrgent ? '#FCA5A5' : '#E8EAED'
  const bgColor     = isUrgent ? '#FFF5F5' : recommended.length > 0 ? '#FAFAFF' : '#FAFAFA'

  if (editing) {
    return (
      <div style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #BFDBFE', background: '#EFF6FF', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input autoFocus value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
          style={{ ...inputStyle, fontSize: 13, fontWeight: 600 }} placeholder="태스크 제목" />
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>예상 시간 (h)</label>
            <input type="number" min="0" max="200" step="1" value={draft.estimatedHours}
              onChange={e => setDraft(p => ({ ...p, estimatedHours: e.target.value }))} style={{ ...inputStyle, fontSize: 13 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 4 }}>우선순위</label>
            <select value={draft.priority} onChange={e => setDraft(p => ({ ...p, priority: e.target.value }))}
              style={{ ...inputStyle, fontSize: 13, cursor: 'pointer' }}>
              {PRIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={{ padding: '5px 12px', fontSize: 12, borderRadius: 8, border: '1px solid #E8EAED', background: '#fff', color: '#6B7280', cursor: 'pointer' }}>취소</button>
          <button onClick={save} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer' }}>저장</button>
        </div>
      </div>
    )
  }

  return (
    <div onClick={onDetail} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${borderColor}`, background: bgColor, cursor: 'pointer' }}>
      {/* 상단: 제목 + 뱃지 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, flexShrink: 0 }}>{item.priority}</span>
        {isUrgent && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 9999, background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', flexShrink: 0 }}>🔥 {Math.ceil((new Date(item.dueDate) - new Date().setHours(0,0,0,0)) / 864e5)}일</span>}
        <button onClick={e => { e.stopPropagation(); setDraft({ title: item.title, estimatedHours: item.estimatedHours, priority: item.priority }); setEditing(true) }}
          style={{ padding: '2px 7px', fontSize: 11, borderRadius: 6, border: '1px solid #E8EAED', background: '#fff', color: '#6B7280', cursor: 'pointer', flexShrink: 0 }}>✏️</button>
        <button onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ padding: '2px 7px', fontSize: 11, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', flexShrink: 0 }}>제거</button>
      </div>

      {/* 하단: 메타 + 담당자 영역 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {item.estimatedHours > 0 && <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>⏱ {item.estimatedHours}시간</span>}
        {item.difficulty && <span style={{ fontSize: 11, color: '#6B7280' }}>· {item.difficulty}</span>}
        {item.stage && <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '1px 6px', borderRadius: 6 }}>{item.stage}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
          {/* 배정된 담당자 */}
          {assignedMembers.map(m => (
            <div key={m.id} title={`${m.name} (클릭해서 제거)`}
              onClick={() => onToggleAssignee(item.id, m.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px 2px 3px', borderRadius: 9999, background: m.color + '22', border: `1px solid ${m.color}55`, cursor: 'pointer' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#fff' }}>{m.initials}</div>
              <span style={{ fontSize: 10, fontWeight: 600, color: m.color }}>{m.name}</span>
              <span style={{ fontSize: 9, color: m.color, opacity: 0.7 }}>✕</span>
            </div>
          ))}

          {/* 추천 담당자 — 클릭하면 수락, X는 거절 */}
          {recommended.map(m => (
            <div key={m.id} onClick={() => onAccept(item.id, m)} title="클릭해서 추천 수락"
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 4px 2px 3px', borderRadius: 9999, background: '#EDE9FE', border: '1px solid #DDD6FE', cursor: 'pointer' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#fff' }}>{m.initials}</div>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#6D28D9' }}>{m.name}</span>
              <span style={{ fontSize: 9, color: '#6B7280', margin: '0 1px' }}>🤖</span>
              <button onClick={e => { e.stopPropagation(); onDismiss(item.id, m.id) }}
                style={{ padding: '0 4px', fontSize: 10, borderRadius: 4, border: '1px solid #DDD6FE', background: '#fff', color: '#9CA3AF', cursor: 'pointer', lineHeight: '16px' }}>✕</button>
            </div>
          ))}

          {/* 팀원 직접 태그 */}
          <div ref={pickerRef} style={{ position: 'relative' }}>
            <button onClick={() => setPickerOpen(p => !p)}
              style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px dashed #D1D5DB', background: '#fff', color: '#9CA3AF', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', lineHeight: 1 }}>+</button>
            {pickerOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setPickerOpen(false)} />
                <div style={{ position: 'absolute', right: 0, top: 28, zIndex: 99, background: '#fff', border: '1px solid #E8EAED', borderRadius: 12, boxShadow: '0 8px 24px rgba(17,24,39,0.14)', padding: 6, minWidth: 160 }}>
                  {members.map(m => {
                    const checked = (item.assignees || []).includes(m.id)
                    return (
                      <div key={m.id} onClick={() => { onToggleAssignee(item.id, m.id); setPickerOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', background: checked ? '#EFF6FF' : 'transparent' }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, border: checked ? 'none' : '1.5px solid #D1D5DB', background: checked ? '#2563EB' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {checked && <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{m.initials}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>{m.role}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const PRIORITY_STYLE_BUILDER = {
  Must:    { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should:  { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:   { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't": { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

const ROLE_KEYWORDS = {
  백엔드:    /api|서버|db|데이터베이스|인증|로그인|crud|저장|연동|스키마|마이그레이션|백엔드|backend/,
  프론트:    /ui|화면|페이지|컴포넌트|버튼|레이아웃|뷰|렌더|표시|모달|폼|프론트|frontend/,
  'AI/백엔드': /ai|알고리즘|추천|분석|모델|자동|예측|계획|초안|분해/,
  디자인:    /디자인|아이콘|스타일|색상|대시보드|ux|ui 디자인/,
}

// 이미 배정된 멤버는 추천에서 제외
function suggestMembers(title, teamMembers, existingAssignees = []) {
  const t = title.toLowerCase()
  const eligible = teamMembers.filter(m => m.role !== 'PM' && !existingAssignees.includes(m.id))
  if (eligible.length === 0) return []
  const scores = eligible.map(m => {
    let score = 0
    Object.entries(ROLE_KEYWORDS).forEach(([roleKey, regex]) => {
      if (m.role.includes(roleKey) && regex.test(t)) score += 3
    })
    return { ...m, score }
  })
  const max = Math.max(...scores.map(s => s.score))
  if (max <= 0) return [eligible[0]]
  return scores.filter(s => s.score === max)
}


export default function SprintBuilderPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { items, update: updateBacklog } = useBacklogStore()
  const { confirmSprint } = useSprintStore()
  const { can } = useAuthStore()
  const { members, updateMember } = useTeamStore()
  const { getMemberStats } = useCapacityHistoryStore()
  const { selected, toggle: planToggle, remove: removePlan, clear: clearPlan } = useSprintPlanStore()

  // 마감일 7일 이내 아이템 자동 추가 (완료/블로커 제외)
  useEffect(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const in7 = new Date(today); in7.setDate(today.getDate() + 7)
    items.forEach(item => {
      if (!item.dueDate) return
      if (item.status === '완료' || item.status === '블로커') return
      const due = new Date(item.dueDate)
      if (due <= in7 && !selected.has(item.id)) planToggle(item.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // useTeamStore 멤버를 capacity 계산에 필요한 필드로 매핑
  const teamMembers = members.map(m => ({
    ...m,
    initials: m.initials || m.name.slice(0, 1),
    hours: m.capacity || 80,
    total: m.capacity || 80,
  }))

  const today = new Date().toISOString().slice(0, 10)
  const twoWeeks = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10)

  const [meta, setMeta] = useState({ name: 'Sprint 2', startDate: today, endDate: twoWeeks, goal: '', focus: [] })
  const [weekdayOnly, setWeekdayOnly] = useState(true)
  const [capacity,   setCapacity]   = useState(() => Object.fromEntries(members.map(m => [m.id, m.capacity || 80])))
  const [result,     setResult]     = useState(null)
  const [draft,      setDraft]      = useState(null)
  const [phase,      setPhase]      = useState('setup')
  const [loading,      setLoading]      = useState(false)
  const [sprintMeta,   setSprintMeta]   = useState(null)
  const [suggestedMap, setSuggestedMap] = useState({})
  const [detailItem,   setDetailItem]   = useState(null)

  // 날짜·토글 변경 시 Capacity 자동 재계산 (1인당 하루 8시간 기준)
  useEffect(() => {
    const days = countDays(meta.startDate, meta.endDate, weekdayOnly)
    const hoursPerPerson = days * 8
    setCapacity(Object.fromEntries(members.map(m => [m.id, hoursPerPerson])))
  }, [meta.startDate, meta.endDate, weekdayOnly])
  const resultRef = useRef(null)

  function autoSuggestAll() {
    const map = {}
    selectedItems.forEach(item => {
      const suggested = suggestMembers(item.title, teamMembers, item.assignees || [])
      if (suggested.length > 0) map[item.id] = suggested
    })
    setSuggestedMap(map)
  }

  function acceptSuggestion(itemId, member) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    updateBacklog(itemId, { assignees: [...(item.assignees || []), member.id] })
    setSuggestedMap(prev => {
      const next = { ...prev }
      const filtered = (next[itemId] || []).filter(m => m.id !== member.id)
      if (filtered.length === 0) delete next[itemId]
      else next[itemId] = filtered
      return next
    })
  }

  function dismissSuggestion(itemId, memberId) {
    setSuggestedMap(prev => {
      const next = { ...prev }
      const filtered = (next[itemId] || []).filter(m => m.id !== memberId)
      if (filtered.length === 0) delete next[itemId]
      else next[itemId] = filtered
      return next
    })
  }

  function toggleAssignee(itemId, memberId) {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const assignees = item.assignees || []
    const next = assignees.includes(memberId)
      ? assignees.filter(id => id !== memberId)
      : [...assignees, memberId]
    updateBacklog(itemId, { assignees: next })
    // 담당자로 확정되면 추천에서도 제거
    if (!assignees.includes(memberId)) {
      setSuggestedMap(prev => {
        const filtered = (prev[itemId] || []).filter(m => m.id !== memberId)
        if (filtered.length === 0) { const n = { ...prev }; delete n[itemId]; return n }
        return { ...prev, [itemId]: filtered }
      })
    }
  }

  const selectedItems = items.filter(i => selected.has(i.id))
  const selectedSP    = selectedItems.reduce((s, i) => s + Number(i.estimatedHours || 0), 0)
  const days = Math.max(0, Math.round((new Date(meta.endDate) - new Date(meta.startDate)) / 864e5) + 1)

  function handleReset() {
    setResult(null); setDraft(null); setPhase('setup'); setSprintMeta(null); clearPlan()
  }

  async function handleGenerate() {
    if (!meta.name.trim() || selected.size === 0 || !can.runAI) return
    setSprintMeta(meta)
    setLoading(true)
    try {
      await callClaude('mock', 'mock')
    } catch {
      const r = buildResult(selectedItems, meta, teamMembers, suggestedMap)
      setResult(r)
      setDraft({ week1: r.week1.map(t => ({ ...t })), week2: r.week2.map(t => ({ ...t })) })
      setPhase('reviewing')
    }
    setLoading(false)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function updateTask(updated) {
    setDraft(prev => ({
      week1: prev.week1.map(t => t._id === updated._id ? updated : t),
      week2: prev.week2.map(t => t._id === updated._id ? updated : t),
    }))
  }

  function deleteTask(id) {
    setDraft(prev => ({ week1: prev.week1.filter(t => t._id !== id), week2: prev.week2.filter(t => t._id !== id) }))
  }

  function moveWeek(task) {
    const from = task.week === 1 ? 'week1' : 'week2'
    const to   = task.week === 1 ? 'week2' : 'week1'
    setDraft(prev => ({
      ...prev,
      [from]: prev[from].filter(t => t._id !== task._id),
      [to]:   [...prev[to], { ...task, week: task.week === 1 ? 2 : 1 }],
    }))
  }

  function handleConfirm() {
    if (!can.confirmSprint || !draft) return
    const allTasks = [...draft.week1, ...draft.week2].map(t => ({ ...t, member: t.members?.[0] || teamMembers[0] }))
    confirmSprint(sprintMeta?.name || 'Sprint 2', allTasks, sprintMeta || {})
    navigate('/sprint/1/board')
  }

  const allDraftTasks = draft ? [...draft.week1, ...draft.week2] : []
  const workload = teamMembers.map(m => ({
    ...m,
    sp: allDraftTasks.filter(t => t.members?.some(mb => mb.id === m.id)).reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0),
  }))
  const maxSP = Math.max(...workload.map(w => w.sp), 1)

  const canGenerate = can.runAI && selected.size > 0 && meta.name.trim()


  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Topbar
        title="이번 계획 만들기"
        subtitle={phase === 'reviewing' ? `${sprintMeta?.name || ''} — AI 초안 검토 & 조정` : `${selected.size}개 태스크 · ${selectedSP}시간`}>
        {phase === 'reviewing' && <button onClick={() => setPhase('setup')} style={btnTertiary}>← 다시 설정</button>}
        {can.deleteSprint && <button onClick={handleReset} style={btnTertiary}>초기화</button>}
      </Topbar>

      <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', padding: isMobile ? '14px 14px 100px' : '20px 24px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── SETUP 단계 ── */}
        {phase === 'setup' && (<>

          {/* 1단계: 스프린트 기본 정보 (인라인) */}
          <div style={{ ...card, padding: isMobile ? 16 : 20 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>① 이번 계획 기본 정보</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>이번 계획 이름 *</label>
                <input style={inputStyle} value={meta.name} onChange={e => setMeta(p => ({ ...p, name: e.target.value }))} placeholder="예: Sprint 2 — 결제 기능" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  기간{days > 0 && <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6 }}>{days}일</span>}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="date" style={{ ...inputStyle, flex: 1 }} value={meta.startDate} onChange={e => setMeta(p => ({ ...p, startDate: e.target.value }))} />
                  <span style={{ color: '#9CA3AF', flexShrink: 0 }}>→</span>
                  <input type="date" style={{ ...inputStyle, flex: 1 }} value={meta.endDate} onChange={e => setMeta(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>이번 계획 목표 <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(선택)</span></label>
                <input style={inputStyle} value={meta.goal} onChange={e => setMeta(p => ({ ...p, goal: e.target.value }))} placeholder="예: 핵심 AI 기능 MVP를 완성해 내부 베타 테스트를 시작한다" />
              </div>
            </div>
          </div>

          {/* 2·3단계: 작업 가능 시간(좌 20%) + 태스크 목록(우 80%) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>

            {/* 2단계: Capacity */}
            <div style={{ ...card, padding: 20, flex: '35 1 260px', minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>② 팀 작업 가능 시간</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { val: true,  label: '평일만', tip: `월~금 기준 · ${countDays(meta.startDate, meta.endDate, true)}일 × 8h = ${countDays(meta.startDate, meta.endDate, true) * 8}시간` },
                    { val: false, label: '매일',   tip: `주말 포함 · ${countDays(meta.startDate, meta.endDate, false)}일 × 8h = ${countDays(meta.startDate, meta.endDate, false) * 8}시간` },
                  ].map(({ val, label, tip }) => (
                    <div key={label} style={{ position: 'relative' }} className="tooltip-wrap">
                      <button
                        onClick={() => setWeekdayOnly(val)}
                        title={tip}
                        style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: `1px solid ${weekdayOnly === val ? '#2563EB' : '#E8EAED'}`, background: weekdayOnly === val ? '#EFF6FF' : '#fff', color: weekdayOnly === val ? '#2563EB' : '#6B7280', cursor: 'pointer' }}>
                        {label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {teamMembers.map(m => {
                  const maxH = countDays(meta.startDate, meta.endDate, weekdayOnly) * 8 || m.total
                  const h = capacity[m.id] ?? maxH
                  const pct = Math.round((h / maxH) * 100)
                  const stats = getMemberStats(m.name, 3)
                  const suggestOveradjust = stats && stats.rate >= 20
                  return (
                    <div key={m.id} style={{ border: '1px solid #E8EAED', borderRadius: 14, padding: '14px 14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{m.initials}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.name}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF' }}>{m.role}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                        <span style={{ color: '#9CA3AF' }}>작업 가능 시간</span>
                        <span style={{ fontWeight: 600, color: '#4B5563' }}>{h}시간 / {maxH}시간</span>
                      </div>
                      <input type="range" min="0" max={maxH} step="4" value={h}
                        onChange={e => {
                          const v = Number(e.target.value)
                          setCapacity(p => ({ ...p, [m.id]: v }))
                          updateMember(m.id, { capacity: v })
                        }}
                        style={{ width: '100%', accentColor: m.color, cursor: 'pointer' }} />

                      {suggestOveradjust && (
                        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                          <p style={{ fontSize: 11, color: '#92400E', lineHeight: 1.5, marginBottom: 6 }}>
                            ⏰ 최근 {stats.sprints}개 계획 평균 일정 초과율 <strong>{stats.rate}%</strong> — 캐파를 낮춰볼까요?
                          </p>
                          <button onClick={() => {
                            const adjusted = Math.max(0, Math.round(maxH * (1 - stats.rate / 100) / 4) * 4)
                            setCapacity(p => ({ ...p, [m.id]: adjusted }))
                            updateMember(m.id, { capacity: adjusted })
                          }} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, border: '1px solid #FDE68A', background: '#fff', color: '#92400E', cursor: 'pointer' }}>
                            {stats.rate}% 낮춰 적용
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 3단계: 선택된 태스크 목록 */}
            <div style={{ ...card, padding: 20, flex: '65 1 380px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>③ 이번 계획 태스크</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 9999 }}>{selected.size}개 · {selectedSP}시간</span>
                  {selectedItems.length > 0 && (
                    <button onClick={autoSuggestAll}
                      style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #DDD6FE', borderRadius: 9999, background: Object.keys(suggestedMap).length > 0 ? '#EDE9FE' : '#fff', color: '#7C3AED', cursor: 'pointer' }}>
                      🤖 담당자 자동 추천
                    </button>
                  )}
                  <button onClick={() => navigate('/backlog')}
                    style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid #E8EAED', borderRadius: 9999, background: '#fff', color: '#4B5563', cursor: 'pointer' }}>
                    + 전체 할일에서 추가
                  </button>
                </div>
              </div>

              {selectedItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📋</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>아직 추가된 태스크가 없어요</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>전체 할일에서 <strong>+ 계획에 추가</strong> 버튼을 눌러보세요</p>
                  <button onClick={() => navigate('/backlog')}
                    style={{ marginTop: 4, padding: '9px 20px', borderRadius: 10, border: 'none', background: '#2563EB', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    전체 할일 보러 가기
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedItems.map(item => (
                    <PlanTaskCard
                      key={item.id}
                      item={item}
                      recommended={suggestedMap[item.id] || []}
                      members={members}
                      onRemove={() => removePlan(item.id)}
                      onSave={patch => updateBacklog(item.id, patch)}
                      onDetail={() => setDetailItem(item)}
                      onAccept={acceptSuggestion}
                      onDismiss={dismissSuggestion}
                      onToggleAssignee={toggleAssignee}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

        </>)}

        {/* 로딩 */}
        {loading && (
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB', animation: `pulse 1.2s ${i*0.2}s infinite` }} />
              ))}
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>AI가 이번 계획을 설계하고 있어요</p>
            <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.25;transform:scale(0.75)}}`}</style>
          </div>
        )}

          {/* 검토 모드 */}
          {!loading && phase === 'reviewing' && draft && (
            <div ref={resultRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 스프린트 메타 요약 */}
              {sprintMeta && (
                <div style={{ ...card, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>이번 계획</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{sprintMeta.name}</div>
                  </div>
                  <div style={{ width: 1, height: 32, background: '#E8EAED' }} />
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>기간</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{sprintMeta.startDate} ~ {sprintMeta.endDate}</div>
                  </div>
                  {sprintMeta.goal && (
                    <>
                      <div style={{ width: 1, height: 32, background: '#E8EAED' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>목표</div>
                        <div style={{ fontSize: 13, color: '#374151' }}>{sprintMeta.goal}</div>
                      </div>
                    </>
                  )}
                  {sprintMeta.focus?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {sprintMeta.focus.map(f => (
                        <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI 근거 */}
              <div style={{ ...card, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>AI 계획 제안 — 검토 중</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 9999 }}>신뢰도 {result?.confidence || 87}%</span>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 10, background: '#EFF6FF', borderLeft: '3px solid #2563EB', fontSize: 13, color: '#1F2937', lineHeight: 1.6 }}>
                  {result?.summary}
                </div>
              </div>

              {/* 확인이 필요한 항목 요약 */}
              {(() => {
                const flagged = allDraftTasks.filter(t => getTaskAlerts(t, allDraftTasks, capacity).length > 0)
                if (flagged.length === 0) return (
                  <div style={{ ...card, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>확인이 필요한 항목 없음 — 바로 확정할 수 있어요</p>
                  </div>
                )
                return (
                  <div style={{ ...card, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>확인이 필요한 항목</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1px 8px', borderRadius: 9999 }}>{flagged.length}개</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {flagged.map(t => {
                        const taskAlerts = getTaskAlerts(t, allDraftTasks, capacity)
                        return (
                          <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', flex: 1 }}>{t.title}</span>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {taskAlerts.map((a, i) => <AlertBadge key={i} {...a} />)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* 주차별 태스크 — overflow visible로 드롭다운 안 잘리게 */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'week1', label: '1주차', color: '#2563EB', chipBg: '#EFF6FF', chipBorder: '#BFDBFE' },
                  { key: 'week2', label: '2주차', color: '#8B5CF6', chipBg: '#F5F3FF', chipBorder: '#DDD6FE' },
                ].map(({ key, label, color, chipBg, chipBorder }) => (
                  <div key={key} style={{ ...card }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color, background: chipBg, padding: '2px 10px', borderRadius: 9999, border: `1px solid ${chipBorder}` }}>
                        주당 {draft[key].reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0)}h
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
                      {draft[key].length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>태스크 없음</div>}
                      {draft[key].map(task => (
                        <ReviewTaskCard key={task._id} task={task} onUpdate={updateTask} onDelete={deleteTask} onMoveWeek={moveWeek} allDraftTasks={allDraftTasks} capacityMap={capacity} teamMembers={teamMembers} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Workload 요약 */}
              <div style={{ ...card, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>팀원별 배정 작업 시간</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
                  {workload.map(m => {
                    const cap = capacity[m.id] ?? (countDays(meta.startDate, meta.endDate, weekdayOnly) * 8)
                    const over = m.sp > cap * 0.8
                    return (
                      <div key={m.id}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{m.initials}</div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{m.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: over ? '#EF4444' : '#111827' }}>{m.sp}시간 {over ? '⚠️' : ''}</span>
                        </div>
                        <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round((m.sp / maxSP) * 100)}%`, background: over ? '#EF4444' : m.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button onClick={handleConfirm} disabled={!can.confirmSprint}
                style={{ ...btnPrimary, width: '100%', justifyContent: 'center', height: 48, borderRadius: 14, fontSize: 14, opacity: can.confirmSprint ? 1 : 0.5 }}>
                {!can.confirmSprint && '🔒 '}이 계획으로 확정하기
              </button>
            </div>
          )}

      </div>

      {/* 하단 고정 CTA — setup 단계만 */}
      {detailItem && (
        <TaskDetailModal
          item={detailItem}
          members={members}
          isPM={can.runAI}
          allItems={items}
          onSave={patch => updateBacklog(detailItem.id, patch)}
          onClose={() => setDetailItem(null)}
        />
      )}

      {!loading && (
        <div style={{ position: 'absolute', bottom: 0, left: 240, right: 0, padding: '16px 24px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #E8EAED', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
          {phase === 'setup' ? (<>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              {selected.size === 0 ? '전체 할일에서 태스크를 추가해주세요' : <><strong style={{ color: '#111827' }}>{selected.size}개</strong> 태스크 · <strong style={{ color: '#2563EB' }}>{selectedSP}시간</strong> 선택됨</>}
            </div>
            <button onClick={handleGenerate} disabled={!canGenerate}
              style={{ ...btnPrimary, height: 44, padding: '0 28px', fontSize: 14, opacity: canGenerate ? 1 : 0.4, cursor: canGenerate ? 'pointer' : 'not-allowed' }}>
              {!can.runAI ? '🔒 PM만 실행 가능' : '✨ AI 계획 초안 만들기'}
            </button>
          </>) : (<>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              검토 완료 후 계획을 확정하세요
            </div>
            <button onClick={handleConfirm} disabled={!can.confirmSprint}
              style={{ ...btnPrimary, height: 44, padding: '0 32px', fontSize: 14, background: can.confirmSprint ? '#16A34A' : '#9CA3AF', cursor: can.confirmSprint ? 'pointer' : 'not-allowed' }}>
              {!can.confirmSprint ? '🔒 계획 확정' : '✅ 계획 확정하기'}
            </button>
          </>)}
        </div>
      )}
    </div>
  )
}
