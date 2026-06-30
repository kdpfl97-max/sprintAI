import { useState } from 'react'

const PRIORITY_OPTIONS   = ['Must', 'Should', 'Could', "Won't"]
const CATEGORY_OPTIONS   = ['기능', '에픽', 'UI/UX', '인프라', '버그']
const DIFFICULTY_OPTIONS = ['낮음', '보통', '높음']
const STATUS_OPTIONS     = ['미배정', '예정', '진행 중', '검토 중', '완료', '블로커']

const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #E8EAED',
  borderRadius: 14, background: '#F4F5F7', fontSize: 13, color: '#111827',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle  = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }
const selectStyle = { ...inputStyle, background: '#F4F5F7', cursor: 'pointer' }
const btnPrimary  = { padding: '0 20px', height: 40, borderRadius: 12, border: 'none', background: '#2563EB', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnTertiary = { ...btnPrimary, background: '#F4F5F7', color: '#1F2937', border: '1px solid #E8EAED' }

export default function TaskDetailModal({ item, members, isPM, onSave, onClose, allItems = [] }) {
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
    assignees: item.assignees || [],
    blockedBy: item.blockedBy || [],
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', border: '1px solid #E8EAED', borderRadius: 16, boxShadow: '0 1px 2px rgba(17,24,39,0.04)', width: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
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

          <div style={{ padding: '14px 16px', borderRadius: 12, background: '#F9FAFB', border: '1px solid #E8EAED' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              소요 시간 & 난이도
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 6, fontSize: 11 }}>— AI 배정 및 Capacity 계산에 사용돼요</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>예상 시간<span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>(시간 단위)</span></label>
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

          <div>
            <label style={labelStyle}>담당자</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {members.map(m => {
                const on = form.assignees.includes(m.id)
                return (
                  <button key={m.id} type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      assignees: on ? f.assignees.filter(id => id !== m.id) : [...f.assignees, m.id]
                    }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
                      border: on ? 'none' : '1px solid #E8EAED',
                      background: on ? m.color : '#F4F5F7',
                      color: on ? 'white' : '#6B7280',
                      cursor: 'pointer',
                    }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: on ? 'rgba(255,255,255,0.3)' : m.color, color: 'white', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{m.initials}</span>
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>

          {allItems.filter(i => i.id !== item.id).length > 0 && (
            <div>
              <label style={labelStyle}>선행 업무<span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>— 이 태스크 전에 완료되어야 하는 업무</span></label>
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
            <label style={labelStyle}>완료 조건<span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>— 무엇이 되면 완료인지</span></label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64, fontFamily: 'inherit', lineHeight: 1.6 }}
              placeholder="예: 구글 계정으로 로그인 후 팀 페이지에 진입할 수 있다"
              value={form.doneCondition}
              onChange={e => setForm(f => ({ ...f, doneCondition: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>산출물 링크<span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>— Figma, GitHub, Notion 등</span></label>
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
