import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore } from '../store/useBacklogStore'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { callClaude } from '../utils/claude'

const PRIORITY_STYLE = {
  Must:    { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should:  { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:   { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't": { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

const MEMBERS = [
  { id: 'a', name: '박준혁', role: '백엔드',    color: '#2563EB', initials: '박', hours: 64, total: 80 },
  { id: 'b', name: '김서연', role: '프론트',    color: '#10B981', initials: '김', hours: 60, total: 80 },
  { id: 'c', name: '이민수', role: 'AI/백엔드', color: '#7C3AED', initials: '이', hours: 48, total: 80 },
  { id: 'd', name: '최지은', role: '디자인',    color: '#D97706', initials: '최', hours: 40, total: 80 },
]

const FOCUS_CHIPS = ['AI 기능', '사용자 피드백', '성능', '기술부채', '신규 기능', '버그 수정', '리팩토링']

const TASK_META = {
  '소셜 로그인 (구글)':    { reason: '모든 기능의 진입 전제 — 인증 없이 팀·백로그 모두 불가',      week: 1, memberId: 'a' },
  '팀 생성 및 초대':       { reason: '백로그·AI 기능이 팀 컨텍스트 필요. 1주차 필수 선행',        week: 1, memberId: 'a' },
  '전체 할 일 CRUD':       { reason: 'AI 계획 초안의 입력 데이터 소스. 이것 없으면 AI 동작 불가', week: 1, memberId: 'b' },
  '백로그 CRUD':           { reason: 'AI 계획 초안의 입력 데이터 소스. 이것 없으면 AI 동작 불가', week: 1, memberId: 'b' },
  'Capacity 입력':         { reason: 'AI 배분 알고리즘 핵심 입력값 — 없으면 초과 배정 위험',      week: 1, memberId: 'b' },
  'AI 계획 초안 알고리즘': { reason: 'SprintAI 핵심 차별점. 2주차 배정은 1주차 인프라 완료 전제', week: 2, memberId: 'c' },
  'AI 이번 계획 만들기':   { reason: 'SprintAI 핵심 차별점. 2주차 배정은 1주차 인프라 완료 전제', week: 2, memberId: 'c' },
  'AI 태스크 분해기':      { reason: '에픽 → 태스크 자동 분해. AI 계획 초안 완성 후 연동',       week: 2, memberId: 'c' },
  '칸반 보드':             { reason: '스프린트 실행 필수 인터페이스 — 배정 완료 후 착수 가능',    week: 2, memberId: 'b' },
  '스프린트 대시보드':     { reason: 'PM 모니터링 화면 — 데이터 흐름이 완성된 2주차에 배정',     week: 2, memberId: 'd' },
  '대시보드':              { reason: 'PM 모니터링 화면 — 데이터 흐름이 완성된 2주차에 배정',     week: 2, memberId: 'd' },
}

function buildResult(selectedItems, meta) {
  const tasks = selectedItems.map(item => {
    const m = TASK_META[item.title] || { reason: '우선순위 고려 배정', week: 2, memberId: 'a' }
    return { ...item, _id: item.id, week: m.week, reason: m.reason, members: [MEMBERS.find(x => x.id === m.memberId) || MEMBERS[0]] }
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
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>스프린트 이름</label>
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
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>스프린트 목표 <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(선택)</span></label>
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

function MemberPicker({ selected, onChange }) {
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)

  function toggle() {
    if (pos) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
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
            position: 'fixed', top: pos.top, right: pos.right, zIndex: 99,
            background: '#fff', border: '1px solid #E8EAED', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(17,24,39,0.14)', padding: 6, minWidth: 170,
          }}>
            {MEMBERS.map(m => {
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

function ReviewTaskCard({ task, onUpdate, onDelete, onMoveWeek, allDraftTasks, capacityMap }) {
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
            <MemberPicker selected={task.members} onChange={members => onUpdate({ ...task, members })} />
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

export default function SprintBuilderPage() {
  const navigate = useNavigate()
  const { items } = useBacklogStore()
  const { confirmSprint } = useSprintStore()
  const { can } = useAuthStore()

  const [selected, setSelected] = useState(
    () => new Set(items.filter(i => i.priority === 'Must' && i.stage === 'MVP').map(i => i.id))
  )

  const [capacity,   setCapacity]   = useState(() => Object.fromEntries(MEMBERS.map(m => [m.id, m.hours])))
  const [result,     setResult]     = useState(null)
  const [draft,      setDraft]      = useState(null)
  const [phase,      setPhase]      = useState('setup')   // 'setup' | 'reviewing'
  const [loading,    setLoading]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [sprintMeta, setSprintMeta] = useState(null)
  const resultRef = useRef(null)

  const selectedItems = items.filter(i => selected.has(i.id))
  const selectedSP    = selectedItems.reduce((s, i) => s + Number(i.estimatedHours || 0), 0)
  const filtered      = items.filter(i => i.title.includes(search) || i.desc?.includes(search))

  function toggleItem(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleReset() {
    setResult(null); setDraft(null); setPhase('setup'); setSprintMeta(null)
    setSelected(new Set(items.filter(i => i.priority === 'Must' && i.stage === 'MVP').map(i => i.id)))
  }

  async function handleGenerate(meta) {
    setShowModal(false)
    setSprintMeta(meta)
    setLoading(true)
    try {
      await callClaude('mock', 'mock')
    } catch {
      const r = buildResult(selectedItems, meta)
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

  const allDraftTasks = draft ? [...draft.week1, ...draft.week2] : []
  const workload = MEMBERS.map(m => ({
    ...m,
    sp: allDraftTasks.filter(t => t.members?.some(mb => mb.id === m.id)).reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0),
  }))
  const maxSP = Math.max(...workload.map(w => w.sp), 1)

  function handleConfirm() {
    if (!can.confirmSprint || !draft) return
    const allTasks = [...draft.week1, ...draft.week2].map(t => ({ ...t, member: t.members?.[0] || MEMBERS[0] }))
    confirmSprint(sprintMeta?.name || 'Sprint 1 — 핵심 AI 기능', allTasks, sprintMeta || {})
    navigate('/sprint/1/board')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {showModal && <SprintMetaModal onConfirm={handleGenerate} onClose={() => setShowModal(false)} />}

      <Topbar title="이번 계획 만들기" subtitle={phase === 'reviewing' ? `${sprintMeta?.name || ''} — AI 초안 검토 & 조정` : '할 일을 선택하면 AI가 계획 초안을 만들어요'}>
        {phase === 'reviewing' && <button onClick={() => setPhase('setup')} style={btnTertiary}>← 다시 설정</button>}
        {can.deleteSprint && <button onClick={handleReset} style={btnTertiary}>초기화</button>}
        {phase === 'setup' && (
          <button onClick={() => setShowModal(true)} disabled={loading || selected.size === 0 || !can.runAI}
            style={{ ...btnPrimary, opacity: (loading || selected.size === 0 || !can.runAI) ? 0.4 : 1 }}>
            {!can.runAI && '🔒 '}{loading ? '초안 만드는 중...' : 'AI 계획 초안 만들기'}
          </button>
        )}
        {phase === 'reviewing' && (
          <button onClick={handleConfirm} disabled={!can.confirmSprint}
            style={{ ...btnSecondary, opacity: can.confirmSprint ? 1 : 0.4 }}>
            {!can.confirmSprint && '🔒 '}스프린트 확정
          </button>
        )}
      </Topbar>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* 왼쪽: 백로그 */}
        <aside style={{ width: 300, minWidth: 300, display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRight: '1px solid #E8EAED' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>백로그</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 9999 }}>{selected.size}개 · {selectedSP}시간</span>
            </div>
            <input style={{ width: '100%', padding: '9px 12px', border: '1px solid #E8EAED', borderRadius: 14, background: '#F4F5F7', fontSize: 13, color: '#1F2937', outline: 'none', boxSizing: 'border-box' }}
              placeholder="태스크 검색..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(item => {
              const on = selected.has(item.id)
              const ps = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE["Won't"]
              return (
                <div key={item.id} onClick={() => toggleItem(item.id)} style={{ padding: '11px 14px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${on ? '#BFDBFE' : '#E8EAED'}`, background: on ? '#EFF6FF' : '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: on ? 'none' : '1.5px solid #D1D5DB', background: on ? '#2563EB' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 9999, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>{item.priority}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 24, gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6B7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{item.estimatedHours}시간</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid #E8EAED', background: '#F4F5F7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: '#6B7280' }}>선택된 태스크</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{selected.size}개</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>총 예상 시간</span>
              <span style={{ fontWeight: 600, color: '#2563EB' }}>{selectedSP}시간</span>
            </div>
          </div>
        </aside>

        {/* 오른쪽 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#F4F5F7', padding: '20px 24px', gap: 16, minWidth: 0 }}>

          {/* Capacity */}
          {phase === 'setup' && (
            <div style={{ ...card, padding: 20, flexShrink: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>팀 Capacity 설정</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {MEMBERS.map(m => {
                  const h = capacity[m.id]
                  const pct = Math.round((h / m.total) * 100)
                  return (
                    <div key={m.id} style={{ border: '1px solid #E8EAED', borderRadius: 14, padding: '14px 14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{m.initials}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.name}</p>
                          <p style={{ fontSize: 11, color: '#9CA3AF' }}>{m.role}</p>
                        </div>
                      </div>
                      <div style={{ height: 6, background: '#E8EAED', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ height: '100%', borderRadius: 3, background: m.color, width: `${pct}%` }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                        <span style={{ color: '#9CA3AF' }}>가용 시간</span>
                        <span style={{ fontWeight: 600, color: '#4B5563' }}>{h}시간 / {m.total}시간</span>
                      </div>
                      <input type="range" min="0" max={m.total} step="4" value={h}
                        onChange={e => setCapacity(p => ({ ...p, [m.id]: Number(e.target.value) }))}
                        style={{ width: '100%', accentColor: m.color, cursor: 'pointer' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 로딩 */}
          {loading && (
            <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, gap: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563EB', animation: `pulse 1.2s ${i*0.2}s infinite` }} />
                ))}
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>AI가 스프린트를 설계하고 있어요</p>
              <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.25;transform:scale(0.75)}}`}</style>
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && phase === 'setup' && (
            <div ref={resultRef} style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>AI</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>태스크를 선택하고 AI 계획 초안을 만들어보세요</p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>스프린트 기본 정보 입력 후 최적 배분을 설계해드려요</p>
            </div>
          )}

          {/* 검토 모드 */}
          {!loading && phase === 'reviewing' && draft && (
            <div ref={resultRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 스프린트 메타 요약 */}
              {sprintMeta && (
                <div style={{ ...card, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>스프린트</div>
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
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>AI 스프린트 제안 — 검토 중</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'week1', label: '1주차', color: '#2563EB', chipBg: '#EFF6FF', chipBorder: '#BFDBFE' },
                  { key: 'week2', label: '2주차', color: '#8B5CF6', chipBg: '#F5F3FF', chipBorder: '#DDD6FE' },
                ].map(({ key, label, color, chipBg, chipBorder }) => (
                  <div key={key} style={{ ...card }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color, background: chipBg, padding: '2px 10px', borderRadius: 9999, border: `1px solid ${chipBorder}` }}>
                        {draft[key].reduce((s, t) => s + (Number(t.estimatedHours) || 0), 0)}시간
                      </span>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
                      {draft[key].length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>태스크 없음</div>}
                      {draft[key].map(task => (
                        <ReviewTaskCard key={task._id} task={task} onUpdate={updateTask} onDelete={deleteTask} onMoveWeek={moveWeek} allDraftTasks={allDraftTasks} capacityMap={capacity} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Workload 요약 */}
              <div style={{ ...card, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>팀원별 배정 작업 시간</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {workload.map(m => {
                    const over = m.sp > 20
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
                {!can.confirmSprint && '🔒 '}이 스프린트로 확정하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
