import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore, EMPTY_ITEM } from '../store/useBacklogStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTeamStore } from '../store/useTeamStore'

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
    case '미배정':       return items.filter(i => i.status === '미배정' || !i.assignee)
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

// 태스크 상세/편집 모달
function TaskDetailModal({ item, members, isPM, onSave, onClose, allItems = [] }) {
  const [form, setForm] = useState({
    title: item.title,
    desc: item.desc || '',
    category: item.category,
    priority: item.priority,
    stage: item.stage,
    estimatedHours: item.estimatedHours || '',
    difficulty: item.difficulty || '보통',
    status: item.status || '미배정',
    dueDate: item.dueDate || '',
    doneCondition: item.doneCondition || '',
    outputLink: item.outputLink || '',
    assignee: item.assignee || null,
    blockedBy: item.blockedBy || [],
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...card, width: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>태스크 상세</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>태스크 이름 *</label>
            <input required style={inputStyle} value={form.title}
              disabled={!isPM}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>설명</label>
            <input style={inputStyle} value={form.desc} disabled={!isPM}
              onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>상태</label>
              <select style={selectStyle} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>우선순위</label>
              <select style={selectStyle} value={form.priority} disabled={!isPM}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* 예상 시간 + 난이도 — 분리된 핵심 필드 */}
          <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F9FAFB', border: '1px solid #E8EAED' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              소요 시간 & 난이도
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6, fontSize: 11 }}>
                — AI 배정 및 Capacity 계산에 사용돼요
              </span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>
                  예상 시간
                  <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>(시간 단위)</span>
                </label>
                <input type="number" min="0.5" max="200" step="0.5"
                  style={inputStyle} placeholder="예: 4"
                  value={form.estimatedHours}
                  onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>난이도</label>
                <select style={selectStyle} value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                  {DIFFICULTY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>마감일</label>
              <input type="date" style={inputStyle} value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>카테고리</label>
              <select style={selectStyle} value={form.category} disabled={!isPM}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
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

          {/* 선행 업무 */}
          {allItems.filter(i => i.id !== item.id).length > 0 && (
            <div>
              <label style={labelStyle}>
                선행 업무
                <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>— 이 태스크 전에 완료되어야 하는 업무</span>
              </label>
              <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid #E8EAED', borderRadius: 10, background: '#F9FAFB', padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allItems.filter(i => i.id !== item.id).map(i => (
                  <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, cursor: 'pointer', background: form.blockedBy.includes(i.id) ? '#EFF6FF' : 'transparent' }}>
                    <input type="checkbox"
                      checked={form.blockedBy.includes(i.id)}
                      onChange={e => {
                        if (e.target.checked) setForm(f => ({ ...f, blockedBy: [...f.blockedBy, i.id] }))
                        else setForm(f => ({ ...f, blockedBy: f.blockedBy.filter(id => id !== i.id) }))
                      }}
                      style={{ accentColor: '#2563EB', width: 14, height: 14, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto', flexShrink: 0 }}>{i.status || '미배정'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>
              완료 조건
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>— 무엇이 되면 완료인지</span>
            </label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64, fontFamily: 'inherit', lineHeight: 1.6 }}
              placeholder="예: 구글 계정으로 로그인 후 팀 페이지에 진입할 수 있다"
              value={form.doneCondition}
              onChange={e => setForm(f => ({ ...f, doneCondition: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>
              산출물 링크
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>— Figma, GitHub, Notion 등</span>
            </label>
            <input style={inputStyle} placeholder="https://..."
              value={form.outputLink}
              onChange={e => setForm(f => ({ ...f, outputLink: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button onClick={() => { onSave(form); onClose() }} style={btnPrimary}>저장</button>
          <button onClick={onClose} style={btnTertiary}>닫기</button>
        </div>
      </div>
    </div>
  )
}

export default function BacklogPage() {
  const navigate = useNavigate()
  const { items, add, update, remove } = useBacklogStore()
  const { currentUser } = useAuthStore()
  const { members } = useTeamStore()
  const isPM = currentUser?.role === 'PM'

  const [form, setForm]           = useState({ ...EMPTY_ITEM })
  const [showForm, setShowForm]   = useState(false)
  const [filter, setFilter]       = useState('전체')
  const [search, setSearch]       = useState('')
  const [editId, setEditId]       = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [sortBy, setSortBy]       = useState(null) // 'dueDate' | 'priority'

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
  const unassigned = items.filter(i => i.status === '미배정' || !i.assignee).length
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
      assignee: item.assignee || null,
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

        {/* 빠른 필터 + 검색 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_FILTERS.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={chip(filter === s)} className="btn-press-soft">
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {[{ key: 'dueDate', label: '마감일순' }, { key: 'priority', label: '우선순위순' }].map(({ key, label }) => (
              <button key={key}
                onClick={() => setSortBy(sortBy === key ? null : key)}
                style={{ padding: '5px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${sortBy === key ? '#2563EB' : '#E8EAED'}`, background: sortBy === key ? '#EFF6FF' : '#FFF', color: sortBy === key ? '#2563EB' : '#6B7280' }}>
                {sortBy === key ? '↑ ' : ''}{label}
              </button>
            ))}
          </div>
          <input
            style={{ ...inputStyle, width: 180 }}
            placeholder="태스크 검색..."
            value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
            onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }}
          />
          <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{filtered.length}개</span>
        </div>

        {/* 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                  {/* 담당자 */}
                  {(() => {
                    const assigneeMember = item.assignee ? members.find(m => m.id === item.assignee) : null
                    return assigneeMember ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: assigneeMember.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                          {assigneeMember.initials}
                        </div>
                        <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{assigneeMember.name}</span>
                      </div>
                    ) : null
                  })()}

                  {/* 작성자 (담당자와 다른 경우만) */}
                  {author && author.id !== item.assignee && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: author.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, opacity: 0.6 }}>
                        {author.initials}
                      </div>
                    </div>
                  )}

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
        </div>
      </div>
    </div>
  )
}
