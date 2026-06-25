import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore } from '../store/useBacklogStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTeamStore } from '../store/useTeamStore'

const PRIORITY_OPTIONS = ['Must', 'Should', 'Could', "Won't"]
const CATEGORY_OPTIONS = ['기능', '에픽', 'UI/UX', '인프라', '버그']
const STAGE_OPTIONS    = ['MVP', 'v1.0', 'v2.0']

const PRIORITY_STYLE = {
  Must:   { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should: { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:  { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't":{ bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

const chip = (active) => ({
  padding: '5px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
  border: `1px solid ${active ? '#2563EB' : '#E8EAED'}`,
  background: active ? '#EFF6FF' : '#FFFFFF',
  color: active ? '#2563EB' : '#4B5563',
  cursor: 'pointer', transition: 'all 100ms',
})

const card = { background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 16, boxShadow: '0 1px 2px rgba(17,24,39,0.04)' }

const EMPTY_FORM = { title: '', desc: '', category: '기능', priority: 'Must', stage: 'MVP', points: '' }

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #E8EAED',
  borderRadius: 14, background: '#F4F5F7', fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }
const selectStyle = { ...inputStyle, background: '#F4F5F7', cursor: 'pointer' }
const btnPrimary = { padding: '0 20px', height: 40, borderRadius: 12, border: 'none', background: '#2563EB', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnTertiary = { ...btnPrimary, background: '#F4F5F7', color: '#1F2937', border: '1px solid #E8EAED' }
const btnSecondary = { ...btnPrimary, background: '#DBEAFE', color: '#1D4ED8', border: 'none' }

export default function BacklogPage() {
  const navigate = useNavigate()
  const { items, add, update, remove } = useBacklogStore()
  const { currentUser } = useAuthStore()
  const { members } = useTeamStore()
  const isPM = currentUser?.role === 'PM'

  const [form, setForm]         = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState('전체')
  const [search, setSearch]     = useState('')
  const [editId, setEditId]     = useState(null)

  const filtered = items.filter(item => {
    const matchStage  = filter === '전체' || item.stage === filter
    const matchSearch = item.title.includes(search) || item.desc.includes(search)
    return matchStage && matchSearch
  })

  const totalSP = items.reduce((sum, i) => sum + Number(i.points), 0)
  const mvpSP   = items.filter(i => i.stage === 'MVP').reduce((sum, i) => sum + Number(i.points), 0)

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editId !== null) { update(editId, form); setEditId(null) }
    else add(form)
    setForm(EMPTY_FORM); setShowForm(false)
  }

  function handleEdit(item) {
    setForm({ title: item.title, desc: item.desc, category: item.category, priority: item.priority, stage: item.stage, points: String(item.points) })
    setEditId(item.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() { setForm(EMPTY_FORM); setEditId(null); setShowForm(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Topbar title="백로그" subtitle={`총 ${items.length}개 태스크 · ${totalSP}작업량`}>
        {isPM && (
          <button onClick={() => navigate('/sprint/builder')} style={btnSecondary} className="btn-press">
            AI 스프린트 생성
          </button>
        )}
        {isPM && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM) }} style={btnPrimary} className="btn-press">
            + 태스크 추가
          </button>
        )}
        {!isPM && (
          <div style={{
            fontSize: 12, fontWeight: 600, color: '#9CA3AF',
            background: '#F4F5F7', border: '1px solid #E8EAED',
            padding: '6px 12px', borderRadius: 9999,
          }}>읽기 전용</div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
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
                <div>
                  <label style={labelStyle}>작업량</label>
                  <input type="number" min="1" max="100" style={inputStyle} placeholder="예: 5"
                    value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
                    onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }} />
                </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            { label: '전체 태스크', value: items.length, unit: '개', sub: `${totalSP}작업량 총합` },
            { label: 'MVP 태스크', value: items.filter(i => i.stage === 'MVP').length, unit: '개', sub: `${mvpSP}작업량 · Must ${items.filter(i => i.priority === 'Must').length}개` },
            { label: '이번 스프린트 후보', value: items.filter(i => i.priority === 'Must' && i.stage === 'MVP').length, unit: '개', sub: `${items.filter(i => i.priority === 'Must' && i.stage === 'MVP').reduce((s,i)=>s+i.points,0)}작업량` },
          ].map(({ label, value, unit, sub }) => (
            <div key={label} style={{ ...card, padding: '16px 20px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                {value}<span style={{ fontSize: 16, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{unit}</span>
              </p>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* 필터 + 검색 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['전체', 'MVP', 'v1.0', 'v2.0'].map(s => (
              <button key={s} onClick={() => setFilter(s)} style={chip(filter === s)} className="btn-press-soft">
                {s}
              </button>
            ))}
          </div>
          <input
            style={{ ...inputStyle, width: 220, marginLeft: 'auto' }}
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
              태스크가 없어요. 위에서 추가해보세요.
            </div>
          )}
          {filtered.map(item => {
            const ps = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE["Won't"]
            const author = item.capturedBy ? members.find(m => m.id === item.capturedBy) : null
            return (
              <div key={item.id} style={{
                ...card, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#D1D5DB'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                  </div>
                  {item.desc && <p style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* 작성자 표시 */}
                  {author && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: author.color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, flexShrink: 0,
                      }}>{author.initials}</div>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{author.name}</span>
                    </div>
                  )}
                  {[
                    { text: item.priority, style: { background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` } },
                    { text: item.category, style: { background: '#F4F5F7', color: '#4B5563', border: '1px solid #E8EAED' } },
                    { text: item.stage,    style: { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' } },
                  ].map(({ text, style }, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, ...style }}>{text}</span>
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 36, textAlign: 'right' }}>{item.points}작업량</span>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                    {isPM && <button onClick={() => handleEdit(item)}
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1px solid #E8EAED', borderRadius: 8, background: '#FFF', color: '#4B5563', cursor: 'pointer' }}
                            className="btn-press-soft">수정</button>}
                    {isPM && <button onClick={() => remove(item.id)}
                            style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, border: '1px solid #FECACA', borderRadius: 8, background: '#FFF5F5', color: '#DC2626', cursor: 'pointer' }}
                            className="btn-press-soft">삭제</button>}
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
