import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore, EMPTY_ITEM } from '../store/useBacklogStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTeamStore } from '../store/useTeamStore'
import { useSprintPlanStore } from '../store/useSprintPlanStore'
import { useIsMobile } from '../hooks/useIsMobile'
import TaskDetailModal from '../components/TaskDetailModal'

const PRIORITY_OPTIONS   = ['Must', 'Should', 'Could', "Won't"]
const CATEGORY_OPTIONS   = ['기능', '에픽', 'UI/UX', '인프라', '버그']
const STAGE_OPTIONS      = ['MVP', 'v1.0', 'v2.0']
const DIFFICULTY_OPTIONS = ['낮음', '보통', '높음']
const STATUS_OPTIONS     = ['미배정', '예정', '진행 중', '검토 중', '완료', '블로커']

const QUICK_FILTERS = ['전체', '미배정', '마감 임박', '블로커', 'MVP', 'v1.0']

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

function daysSinceUpdate(isoString) {
  if (!isoString) return null
  return Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24))
}

function applyQuickFilter(items, filter) {
  const soon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  switch (filter) {
    case '미배정':    return items.filter(i => i.status === '미배정' || !i.assignees?.length)
    case '마감 임박': return items.filter(i => i.dueDate && new Date(i.dueDate) <= soon && i.status !== '완료')
    case '블로커':    return items.filter(i => i.status === '블로커')
    case 'MVP':       return items.filter(i => i.stage === 'MVP')
    case 'v1.0':      return items.filter(i => i.stage === 'v1.0')
    case 'v2.0':      return items.filter(i => i.stage === 'v2.0')
    default:          return items
  }
}

function Badge({ bg, color, border, children }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999, background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {children}
    </span>
  )
}

export default function BacklogPage() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
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
  const [sortBy, setSortBy]       = useState(null)

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

  const pad = isMobile ? '14px 16px' : '20px 24px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {detailItem && (
        <TaskDetailModal
          item={detailItem} members={members} isPM={isPM} allItems={items}
          onSave={patch => update(detailItem.id, patch)}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* 탑바 */}
      <Topbar title="전체 할 일" subtitle={`총 ${items.length}개 · ${totalHours}시간`}>
        {isPM && !isMobile && (
          <button onClick={() => navigate('/sprint/builder')} style={btnSecondary} className="btn-press">
            이번 계획 만들기
          </button>
        )}
        {isPM && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...EMPTY_ITEM }) }} style={isMobile ? { ...btnPrimary, padding: '0 14px', fontSize: 12 } : btnPrimary} className="btn-press">
            + {isMobile ? '추가' : '태스크 추가'}
          </button>
        )}
      </Topbar>

      <div style={{ flex: 1, overflowY: 'auto', padding: pad, display: 'flex', flexDirection: 'column', gap: 14, background: '#F4F5F7' }}>

        {/* 태스크 입력 폼 */}
        {showForm && (
          <div style={{ ...card, padding: isMobile ? 16 : 20, borderColor: '#BFDBFE', boxShadow: '0 0 0 3px rgba(37,99,235,0.07)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
              {editId !== null ? '태스크 수정' : '새 태스크 추가'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>태스크 이름 *</label>
                <input required style={inputStyle} placeholder="예: 구글 소셜 로그인 구현"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>설명</label>
                <input style={inputStyle} placeholder="간단한 설명"
                  value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
              </div>
              {/* 카테고리/우선순위/단계 */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { label: '카테고리', key: 'category', opts: CATEGORY_OPTIONS },
                  { label: '우선순위', key: 'priority', opts: PRIORITY_OPTIONS },
                  { label: '출시 단계', key: 'stage',    opts: STAGE_OPTIONS },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label style={labelStyle}>{label}</label>
                    <select style={selectStyle} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>예상 시간</label>
                  <input type="number" min="0.5" max="200" step="0.5" style={inputStyle} placeholder="시간"
                    value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>난이도</label>
                  <select style={selectStyle} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    {DIFFICULTY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={btnPrimary} className="btn-press">
                  {editId !== null ? '수정 완료' : '추가'}
                </button>
                <button type="button" onClick={handleCancel} style={btnTertiary} className="btn-press">취소</button>
              </div>
            </form>
          </div>
        )}

        {/* 통계 카드 — 모바일 2×2 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14 }}>
          {[
            { label: '전체 태스크', value: items.length,   sub: `예상 ${totalHours}시간`, color: '#111827' },
            { label: 'MVP 태스크', value: items.filter(i => i.stage === 'MVP').length, sub: `예상 ${mvpHours}시간`, color: '#111827' },
            { label: '미배정', value: unassigned, sub: '담당자 없음', color: unassigned > 0 ? '#D97706' : '#059669' },
            { label: '블로커', value: blockers,   sub: '막혀있는 태스크', color: blockers > 0 ? '#DC2626' : '#059669' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ ...card, padding: isMobile ? '14px 16px' : '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, lineHeight: 1, color }}>
                {value}<span style={{ fontSize: 14, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>개</span>
              </p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* 필터 + 검색 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 빠른 필터 칩 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_FILTERS.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                style={{
                  padding: '5px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${filter === s ? '#2563EB' : '#E8EAED'}`,
                  background: filter === s ? '#EFF6FF' : '#FFF',
                  color: filter === s ? '#2563EB' : '#4B5563', cursor: 'pointer',
                }}
                className="btn-press-soft">{s}</button>
            ))}
          </div>
          {/* 검색 + 정렬 한 줄 */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              placeholder="태스크 검색..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {[{ key: 'dueDate', label: '마감일' }, { key: 'priority', label: '우선순위' }].map(({ key, label }) => (
              <button key={key}
                onClick={() => setSortBy(sortBy === key ? null : key)}
                style={{
                  padding: '5px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: `1px solid ${sortBy === key ? '#2563EB' : '#E8EAED'}`,
                  background: sortBy === key ? '#EFF6FF' : '#FFF',
                  color: sortBy === key ? '#2563EB' : '#6B7280', whiteSpace: 'nowrap',
                }}>
                {label}{sortBy === key ? ' ↑' : ''}
              </button>
            ))}
            <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{filtered.length}개</span>
          </div>
        </div>

        {/* 태스크 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '52px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              {items.length === 0 ? (
                <>
                  <div style={{ fontSize: 40 }}>📋</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>아직 태스크가 없어요</p>
                  {isPM ? (
                    <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>오른쪽 위 <strong>+ 추가</strong> 버튼으로<br />첫 번째 태스크를 만들어보세요</p>
                  ) : (
                    <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>PM이 태스크를 등록하면<br />여기에 표시돼요</p>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 36 }}>🔍</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>검색 결과가 없어요</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>필터 조건을 바꿔보세요</p>
                </>
              )}
            </div>
          )}

          {filtered.map(item => {
            const ps  = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE["Won't"]
            const ss  = STATUS_STYLE[item.status] || STATUS_STYLE['미배정']
            const stale = (daysSinceUpdate(item.lastUpdatedAt) ?? 99) >= 2
            const assigneeMember = (item.assignees || []).map(aid => members.find(m => m.id === aid)).filter(Boolean)

            if (isMobile) {
              // 모바일: 카드형 세로 레이아웃
              return (
                <div key={item.id}
                  onClick={() => setDetailItem(item)}
                  style={{
                    ...card,
                    padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    borderLeft: item.status === '블로커' ? '3px solid #DC2626' : undefined,
                  }}>
                  {/* 제목 + 상태 */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <p style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.4 }}>
                      {item.title}
                    </p>
                    <Badge {...ss}>{item.status || '미배정'}</Badge>
                  </div>

                  {/* 설명 */}
                  {item.desc && (
                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{item.desc}</p>
                  )}

                  {/* 배지 행 */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge {...ps}>{item.priority}</Badge>
                    {item.estimatedHours > 0 && (
                      <Badge bg="#F4F5F7" color="#6B7280" border="#E8EAED">{item.estimatedHours}시간</Badge>
                    )}
                    {item.stage && (
                      <Badge bg="#EFF6FF" color="#2563EB" border="#BFDBFE">{item.stage}</Badge>
                    )}
                    {stale && item.status !== '미배정' && item.status !== '완료' && (
                      <Badge bg="#FEF3C7" color="#D97706" border="#FDE68A">업데이트 없음</Badge>
                    )}
                  </div>

                  {/* 담당자 + 액션 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {assigneeMember.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>담당자 없음</span>
                      ) : assigneeMember.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: m.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
                            {m.initials}
                          </div>
                          <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{m.name}</span>
                        </div>
                      ))}
                    </div>
                    {isPM && (
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => planToggle(item.id)}
                          style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, border: `1px solid ${planSelected.has(item.id) ? '#BFDBFE' : '#E8EAED'}`, background: planSelected.has(item.id) ? '#EFF6FF' : '#FFF', color: planSelected.has(item.id) ? '#2563EB' : '#6B7280', cursor: 'pointer' }}
                          className="btn-press-soft">
                          {planSelected.has(item.id) ? '✓ 계획' : '+ 계획'}
                        </button>
                        <button onClick={() => handleEdit(item)}
                          style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', border: '1px solid #E8EAED', borderRadius: 8, background: '#FFF', color: '#4B5563', cursor: 'pointer' }}
                          className="btn-press-soft">수정</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            // 데스크탑: 가로 한 줄
            return (
              <div key={item.id}
                style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                onClick={() => setDetailItem(item)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}
              >
                {item.status === '블로커' && (
                  <div style={{ width: 3, alignSelf: 'stretch', background: '#DC2626', borderRadius: 9999, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    {stale && item.status !== '미배정' && item.status !== '완료' && (
                      <Badge bg="#FEF3C7" color="#D97706" border="#FDE68A">업데이트 없음</Badge>
                    )}
                  </div>
                  {item.desc && (
                    <p style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {assigneeMember.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: m.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{m.initials}</div>
                      <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{m.name}</span>
                    </div>
                  ))}
                  <Badge {...ss}>{item.status || '미배정'}</Badge>
                  <Badge {...ps}>{item.priority}</Badge>
                  {item.estimatedHours > 0 && (
                    <Badge bg="#F4F5F7" color="#6B7280" border="#E8EAED">{item.estimatedHours}시간</Badge>
                  )}
                  {item.dueDate && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{item.dueDate}</span>}
                  {item.outputLink && (
                    <a href={item.outputLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                      style={{ fontSize: 11, color: '#2563EB', textDecoration: 'none' }}>🔗</a>
                  )}
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
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
        </div>
      </div>
    </div>
  )
}
