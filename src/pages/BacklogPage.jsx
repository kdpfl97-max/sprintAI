import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore, EMPTY_ITEM } from '../store/useBacklogStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTeamStore } from '../store/useTeamStore'
import { useSprintPlanStore } from '../store/useSprintPlanStore'
import TaskDetailModal from '../components/TaskDetailModal'

const PRIORITY_OPTIONS  = ['Must', 'Should', 'Could', "Won't"]
const CATEGORY_OPTIONS  = ['기능', '에픽', 'UI/UX', '인프라', '버그']
const STAGE_OPTIONS     = ['MVP', 'v1.0', 'v2.0']
const DIFFICULTY_OPTIONS = ['낮음', '보통', '높음']
const STATUS_OPTIONS    = ['미배정', '예정', '진행 중', '검토 중', '완료', '블로커']

// 빠른 필터 — 인터뷰 P0
const QUICK_FILTERS = ['전체', '미배정', '마감 임박', '업데이트 없음', '블로커', 'MVP', 'v1.0', 'v2.0']

const PRIORITY_ORDER = { Must: 0, Should: 1, Could: 2, "Won't": 3 }

const PRIORITY_STYLE = {
  Must:    { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should:  { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:   { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't": { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

const STATUS_STYLE = {
  '미배정':  { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
  '예정':    { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  '진행 중': { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  '검토 중': { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  '완료':    { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  '블로커':  { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
}

const DIFFICULTY_STYLE = {
  '낮음': { color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
  '보통': { color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  '높음': { color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
}

const chip = (active) => ({
  padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
  border: `1px solid ${active ? '#2563EB' : '#E8EAED'}`,
  background: active ? '#EFF6FF' : '#FFFFFF',
  color: active ? '#2563EB' : '#4B5563',
  cursor: 'pointer', transition: 'all 100ms',
})

const card = { background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 16, boxShadow: '0 1px 2px rgba(17,24,39,0.04)' }

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #E8EAED',
  borderRadius: 14, background: '#F4F5F7', fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }
const selectStyle = { ...inputStyle, background: '#F4F5F7', cursor: 'pointer' }
const btnPrimary   = { padding: '0 20px', height: 40, borderRadius: 12, border: 'none', background: '#2563EB', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnTertiary  = { ...btnPrimary, background: '#F4F5F7', color: '#1F2937', border: '1px solid #E8EAED' }
const btnSecondary = { ...btnPrimary, background: '#DBEAFE', color: '#1D4ED8', border: 'none' }

// 마지막 업데이트로부터 몇 일 지났는지 계산
function daysSinceUpdate(isoString) {
  if (!isoString) return null
  const diff = Date.now() - new Date(isoString).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function applyQuickFilter(items, filter) {
  const today = new Date()
  const soon = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) // 3일 이내
  switch (filter) {
    case '미배정':       return items.filter(i => i.status === '미배정' || !i.assignees?.length)
    case '마감 임박':    return items.filter(i => i.dueDate && new Date(i.dueDate) <= soon && i.status !== '완료')
    case '업데이트 없음': return items.filter(i => {
      const days = daysSinceUpdate(i.lastUpdatedAt)
      return days === null || days >= 2
    })
    case '블로커':       return items.filter(i => i.status === '블로커')
    case 'MVP':          return items.filter(i => i.stage === 'MVP')
    case 'v1.0':         return items.filter(i => i.stage === 'v1.0')
    case 'v2.0':         return items.filter(i => i.stage === 'v2.0')
    default:             return items
  }
}

export default function BacklogPage() {
  const navigate = useNavigate()
  const { items, add, update, remove } = useBacklogStore()
  const { currentUser } = useAuthStore()
  const { members } = useTeamStore()
  const { selected: planSelected, toggle: planToggle } = useSprintPlanStore()
  const isPM = currentUser?.role === 'PM'

  const [form, setForm]           = useState({ ...EMPTY_ITEM })
  const [showForm, setShowForm]   = useState(false)
  const [filter, setFilter]       = useState('전체')
  const [search, setSearch]       = useState('')
  const [editId, setEditId]       = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [sortBy, setSortBy]       = useState(null) // 'dueDate' | 'priority'
  const [viewMode, setViewMode]   = useState('list') // 'list' | 'calendar'
  const [calMonth, setCalMonth]   = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })

  const baseFiltered = applyQuickFilter(items, filter)
  const searched = baseFiltered.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.desc || '').toLowerCase().includes(search.toLowerCase())
  )
  const filtered = sortBy === 'dueDate'
    ? [...searched].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate) - new Date(b.dueDate)
      })
    : sortBy === 'priority'
    ? [...searched].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
    : searched

  const totalHours = items.reduce((sum, i) => sum + Number(i.estimatedHours || 0), 0)
  const mvpHours   = items.filter(i => i.stage === 'MVP').reduce((sum, i) => sum + Number(i.estimatedHours || 0), 0)
  const unassigned = items.filter(i => i.status === '미배정' || !i.assignees?.length).length
  const blockers   = items.filter(i => i.status === '블로커').length

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editId !== null) { update(editId, form); setEditId(null) }
    else add(form, currentUser?.id || null)
    setForm({ ...EMPTY_ITEM }); setShowForm(false)
  }

  function handleEdit(item) {
    setForm({
      title: item.title, desc: item.desc || '', category: item.category,
      priority: item.priority, stage: item.stage,
      estimatedHours: String(item.estimatedHours || ''),
      difficulty: item.difficulty || '보통',
      status: item.status || '미배정',
      dueDate: item.dueDate || '',
      doneCondition: item.doneCondition || '',
      outputLink: item.outputLink || '',
      assignees: item.assignees || [],
      blockedBy: item.blockedBy || [],
    })
    setEditId(item.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() { setForm({ ...EMPTY_ITEM }); setEditId(null); setShowForm(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* 상세 모달 */}
      {detailItem && (
        <TaskDetailModal
          item={detailItem}
          members={members}
          isPM={isPM}
          allItems={items}
          onSave={patch => update(detailItem.id, patch)}
          onClose={() => setDetailItem(null)}
        />
      )}

      <Topbar title="전체 할 일" subtitle={`총 ${items.length}개 태스크 · 예상 ${totalHours}시간`}>
        {isPM && (
          <button onClick={() => navigate('/sprint/builder')} style={btnSecondary} className="btn-press">
            이번 계획 만들기
          </button>
        )}
        {isPM && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_ITEM }) }} style={btnPrimary} className="btn-press">
            + 태스크 추가
          </button>
        )}
        {!isPM && (
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', background: '#F4F5F7', border: '1px solid #E8EAED', padding: '6px 12px', borderRadius: 9999 }}>
            읽기 전용
          </div>
        )}
      </Topbar>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, background: '#F4F5F7' }}>

        {/* 태스크 입력 폼 */}
        {showForm && (
          <div style={{ ...card, padding: 20, borderColor: '#BFDBFE', boxShadow: '0 0 0 3px rgba(37,99,235,0.07)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              {editId !== null ? '태스크 수정' : '새 태스크 추가'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>태스크 이름 *</label>
                <input required style={inputStyle} placeholder="예: 구글 소셜 로그인 구현"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
                  onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }} />
              </div>
              <div>
                <label style={labelStyle}>설명</label>
                <input style={inputStyle} placeholder="간단한 설명을 입력하세요"
                  value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
                  onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { label: '카테고리', key: 'category', opts: CATEGORY_OPTIONS },
                  { label: '우선순위', key: 'priority', opts: PRIORITY_OPTIONS },
                  { label: '출시 단계', key: 'stage', opts: STAGE_OPTIONS },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <select style={selectStyle} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* 예상 시간 + 난이도 — 핵심 분리 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E8EAED' }}>
                <div>
                  <label style={labelStyle}>
                    예상 시간
                    <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4, fontSize: 11 }}>(시간 단위)</span>
                  </label>
                  <input type="number" min="0.5" max="200" step="0.5" style={inputStyle} placeholder="예: 4"
                    value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
                    onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }} />
                </div>
                <div>
                  <label style={labelStyle}>난이도</label>
                  <select style={selectStyle} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    {DIFFICULTY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* 담당자 */}
              <div>
                <label style={labelStyle}>담당자</label>
                <select style={selectStyle} value={form.assignee || ''}
                  onChange={e => setForm(f => ({ ...f, assignee: e.target.value || null }))}>
                  <option value="">미배정</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button type="submit" style={btnPrimary} className="btn-press">
                  {editId !== null ? '수정 완료' : '추가'}
                </button>
                <button type="button" onClick={handleCancel} style={btnTertiary} className="btn-press">취소</button>
              </div>
            </form>
          </div>
        )}

        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {[
            { label: '전체 태스크', value: items.length, unit: '개', sub: `예상 ${totalHours}시간`, color: '#111827' },
            { label: 'MVP 태스크', value: items.filter(i => i.stage === 'MVP').length, unit: '개', sub: `예상 ${mvpHours}시간`, color: '#111827' },
            { label: '미배정', value: unassigned, unit: '개', sub: '담당자 없는 태스크', color: unassigned > 0 ? '#D97706' : '#059669' },
            { label: '블로커', value: blockers, unit: '개', sub: '막혀있는 태스크', color: blockers > 0 ? '#DC2626' : '#059669' },
          ].map(({ label, value, unit, sub, color }) => (
            <div key={label} style={{ ...card, padding: '16px 20px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color }}>
                {value}<span style={{ fontSize: 16, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{unit}</span>
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* 빠른 필터 + 검색 + 뷰 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_FILTERS.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={chip(filter === s)} className="btn-press-soft">
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {viewMode === 'list' && [{ key: 'dueDate', label: '마감일순' }, { key: 'priority', label: '우선순위순' }].map(({ key, label }) => (
              <button key={key}
                onClick={() => setSortBy(sortBy === key ? null : key)}
                style={{ padding: '5px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${sortBy === key ? '#2563EB' : '#E8EAED'}`, background: sortBy === key ? '#EFF6FF' : '#FFF', color: sortBy === key ? '#2563EB' : '#6B7280' }}>
                {sortBy === key ? '↑ ' : ''}{label}
              </button>
            ))}
          </div>
          {viewMode === 'list' && (
            <input
              style={{ ...inputStyle, width: 180 }}
              placeholder="태스크 검색..."
              value={search} onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
              onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }}
            />
          )}
          {viewMode === 'list' && <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{filtered.length}개</span>}
          {/* 뷰 모드 토글 */}
          <div style={{ display: 'flex', borderRadius: 10, border: '1px solid #E8EAED', overflow: 'hidden', flexShrink: 0 }}>
            {[{ v: 'list', label: '☰ 목록' }, { v: 'calendar', label: '📅 달력' }].map(({ v, label }) => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: viewMode === v ? '#2563EB' : '#FFF', color: viewMode === v ? 'white' : '#6B7280' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 달력 뷰 */}
        {viewMode === 'calendar' && (() => {
          const { year, month } = calMonth
          const firstDay = new Date(year, month, 1).getDay()
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
          const calItems = applyQuickFilter(items, filter).filter(i => i.dueDate)
          const byDate = {}
          calItems.forEach(i => { const d = i.dueDate.slice(0,10); if (!byDate[d]) byDate[d] = []; byDate[d].push(i) })
          const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
          const DAY_NAMES = ['일','월','화','수','목','금','토']
          const cells = []
          for (let i = 0; i < firstDay; i++) cells.push(null)
          for (let d = 1; d <= daysInMonth; d++) cells.push(d)
          while (cells.length % 7 !== 0) cells.push(null)
          return (
            <div style={{ ...card, boxSizing: 'border-box', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #E8EAED' }}>
                <button onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month-1, 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                  style={{ background: 'none', border: '1px solid #E8EAED', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: '#4B5563' }}>‹</button>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{year}년 {MONTH_NAMES[month]}</span>
                <button onClick={() => setCalMonth(p => { const d = new Date(p.year, p.month+1, 1); return { year: d.getFullYear(), month: d.getMonth() } })}
                  style={{ background: 'none', border: '1px solid #E8EAED', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: '#4B5563' }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #E8EAED' }}>
                {DAY_NAMES.map((d, i) => (
                  <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 600, color: i===0 ? '#EF4444' : i===6 ? '#2563EB' : '#9CA3AF' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                {cells.map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} style={{ minHeight: 72, borderRight: idx%7!==6 ? '1px solid #F3F4F6' : 'none', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }} />
                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const dayItems = byDate[dateStr] || []
                  const isToday = dateStr === todayStr
                  const dow = (firstDay + day - 1) % 7
                  return (
                    <div key={day} style={{ minHeight: 72, borderRight: idx%7!==6 ? '1px solid #F3F4F6' : 'none', borderBottom: '1px solid #F3F4F6', padding: '6px 6px 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isToday ? '#2563EB' : 'transparent', fontSize: 11, fontWeight: isToday ? 700 : 400, color: isToday ? 'white' : dow===0 ? '#EF4444' : dow===6 ? '#2563EB' : '#374151' }}>{day}</div>
                      {dayItems.slice(0,3).map(t => {
                        const ps = PRIORITY_STYLE[t.priority] || PRIORITY_STYLE["Won't"]
                        return (
                          <div key={t.id} onClick={() => setDetailItem(t)} title={t.title}
                            style={{ fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 4, background: ps.bg, color: ps.color, cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {t.title}
                          </div>
                        )
                      })}
                      {dayItems.length > 3 && <div style={{ fontSize: 9, color: '#9CA3AF', paddingLeft: 5 }}>+{dayItems.length-3}개</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* 목록 */}
        {viewMode === 'list' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9CA3AF', fontSize: 14 }}>
              태스크가 없어요.
            </div>
          )}
          {filtered.map(item => {
            const ps  = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE["Won't"]
            const ss  = STATUS_STYLE[item.status] || STATUS_STYLE['미배정']
            const ds  = DIFFICULTY_STYLE[item.difficulty] || DIFFICULTY_STYLE['보통']
            const author = item.capturedBy ? members.find(m => m.id === item.capturedBy) : null
            const stale  = (daysSinceUpdate(item.lastUpdatedAt) ?? 99) >= 2

            return (
              <div key={item.id} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                onClick={() => setDetailItem(item)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}
              >
                {/* 블로커 인디케이터 */}
                {item.status === '블로커' && (
                  <div style={{ width: 3, alignSelf: 'stretch', background: '#DC2626', borderRadius: 9999, flexShrink: 0 }} />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {stale && item.status !== '미배정' && item.status !== '완료' && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1px 6px', borderRadius: 9999, flexShrink: 0 }}>
                        업데이트 없음
                      </span>
                    )}
                  </div>
                  {item.desc && (
                    <p style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* 작성자 */}
                  {author && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: author.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>
                        {author.initials}
                      </div>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>작성</span>
                    </div>
                  )}

                  {/* 담당자 구분선 */}
                  {author && (item.assignees || []).length > 0 && (
                    <span style={{ fontSize: 10, color: '#D1D5DB' }}>→</span>
                  )}

                  {/* 담당자 */}
                  {(item.assignees || []).map(aid => {
                    const m = members.find(m => m.id === aid)
                    return m ? (
                      <div key={aid} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                          {m.initials}
                        </div>
                        <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{m.name}</span>
                      </div>
                    ) : null
                  })}

                  {/* 상태 */}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
                    {item.status || '미배정'}
                  </span>

                  {/* 우선순위 */}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                    {item.priority}
                  </span>

                  {/* 예상 시간 */}
                  {item.estimatedHours > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', background: '#F4F5F7', border: '1px solid #E8EAED', padding: '2px 8px', borderRadius: 9999 }}>
                      {item.estimatedHours}시간
                    </span>
                  )}

                  {/* 난이도 */}
                  {item.difficulty && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: ds.bg, color: ds.color, border: `1px solid ${ds.border}` }}>
                      {item.difficulty}
                    </span>
                  )}

                  {/* 마감일 */}
                  {item.dueDate && (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>{item.dueDate}</span>
                  )}

                  {/* 산출물 링크 */}
                  {item.outputLink && (
                    <a href={item.outputLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      style={{ fontSize: 11, color: '#2563EB', textDecoration: 'none' }}>🔗</a>
                  )}

                  <div style={{ display: 'flex', gap: 4, marginLeft: 4 }} onClick={e => e.stopPropagation()}>
                    {isPM && (() => {
                      const inPlan = planSelected.has(item.id)
                      return (
                        <button onClick={() => planToggle(item.id)}
                          style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `1px solid ${inPlan ? '#BFDBFE' : '#E8EAED'}`, background: inPlan ? '#EFF6FF' : '#FFF', color: inPlan ? '#2563EB' : '#6B7280', whiteSpace: 'nowrap' }}
                          className="btn-press-soft">{inPlan ? '✓ 계획에 추가됨' : '+ 계획에 추가'}</button>
                      )
                    })()}
                    {isPM && (
                      <button onClick={() => handleEdit(item)}
                        style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1px solid #E8EAED', borderRadius: 8, background: '#FFF', color: '#4B5563', cursor: 'pointer' }}
                        className="btn-press-soft">수정</button>
                    )}
                    {isPM && (
                      <button onClick={() => remove(item.id)}
                        style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1px solid #FECACA', borderRadius: 8, background: '#FFF5F5', color: '#DC2626', cursor: 'pointer' }}
                        className="btn-press-soft">삭제</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>}
      </div>
    </div>
  )
}
