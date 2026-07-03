import { useState } from 'react'
import Topbar from '../components/layout/Topbar'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTeamStore, ROLE_OPTIONS, COLOR_OPTIONS } from '../store/useTeamStore'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'

const card = { background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 16, boxShadow: '0 1px 2px rgba(17,24,39,0.04)' }
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #E8EAED', borderRadius: 14, background: '#F4F5F7', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 6 }
const btnPrimary = { padding: '0 20px', height: 40, borderRadius: 12, border: 'none', background: '#2563EB', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnTertiary = { ...btnPrimary, background: '#F4F5F7', color: '#1F2937', border: '1px solid #E8EAED' }

const EMPTY_FORM = { name: '', role: '프론트엔드', email: '', capacity: 80, color: '#2563EB' }

function focusInput(e) { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }
function blurInput(e)  { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }

function MemberForm({ initial = EMPTY_FORM, onSubmit, onCancel, title }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ ...card, padding: 20, borderColor: '#BFDBFE', boxShadow: '0 0 0 3px rgba(37,99,235,0.07)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16 }}>{title}</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {[
          { label: '이름 *', key: 'name', placeholder: '예: 홍길동', type: 'text' },
          { label: '이메일', key: 'email', placeholder: '예: hong@team.io', type: 'email' },
        ].map(({ label, key, placeholder, type }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input type={type} style={inputStyle} placeholder={placeholder}
              value={form[key]} onChange={e => set(key, e.target.value)}
              onFocus={focusInput} onBlur={blurInput} />
          </div>
        ))}
        <div>
          <label style={labelStyle}>역할</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>이번 계획 가용 시간 (h)</label>
          <input type="number" min="0" max="160" style={inputStyle}
            value={form.capacity} onChange={e => set('capacity', Number(e.target.value))}
            onFocus={focusInput} onBlur={blurInput} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>아바타 색상</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {COLOR_OPTIONS.map(c => (
            <button key={c} onClick={() => set('color', c)} style={{
              width: 28, height: 28, borderRadius: '50%', border: `2px solid ${form.color === c ? '#111827' : 'transparent'}`,
              background: c, cursor: 'pointer',
              transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
              transition: 'transform 100ms',
            }} />
          ))}
          <div style={{
            width: 32, height: 32, borderRadius: '50%', marginLeft: 8,
            background: form.color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
          }}>{form.name?.slice(0, 1) || '?'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => form.name.trim() && onSubmit(form)} disabled={!form.name.trim()}
                style={{ ...btnPrimary, opacity: form.name.trim() ? 1 : 0.4 }} className="btn-press">저장</button>
        <button onClick={onCancel} style={btnTertiary} className="btn-press">취소</button>
      </div>
    </div>
  )
}


export default function TeamPage() {
  const isMobile = useIsMobile()
  const { currentUser } = useAuthStore()
  const isPM = currentUser?.role === 'PM'
  const { members, addMember, updateMember, removeMember, settings, regenerateCode, setDiscordWebhook } = useTeamStore()
  const { sprint } = useSprintStore()
  const [showAdd, setShowAdd]       = useState(false)
  const [editId, setEditId]         = useState(null)
  const [deleteId, setDeleteId]     = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [copied, setCopied]         = useState(false)
  const [webhookInput, setWebhookInput] = useState(settings.discordWebhook || '')

  function copyCode() {
    navigator.clipboard.writeText(settings.teamCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function getMemberStats(member) {
    const myTasks = sprint.tasks.filter(t => t.member?.name === member.name)
    const done    = myTasks.filter(t => t.status === 'done').length
    const sp      = myTasks.reduce((s, t) => s + (t.points || 0), 0)
    const doneSp  = myTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.points || 0), 0)
    return { myTasks, done, total: myTasks.length, sp, doneSp }
  }

  const totalCapacity = members.reduce((s, m) => s + m.capacity, 0)
  const doneCount     = sprint.tasks.filter(t => t.status === 'done').length
  const totalTasks    = sprint.tasks.length
  const completionPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0


  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Topbar title="팀 관리" subtitle={`총 ${members.length}명 · 이번 계획 가용 시간 ${totalCapacity}시간`}>
        {isPM && (
          <button onClick={() => setShowInvite(true)} style={btnPrimary} className="btn-press">
            + 팀원 초대
          </button>
        )}
      </Topbar>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, background: '#F4F5F7' }}>

        {!isPM && (
          <div style={{ ...card, padding: '12px 16px', background: '#F9FAFB', color: '#6B7280', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔒 팀원 정보는 PM만 수정할 수 있어요. 열람만 가능합니다.
          </div>
        )}

        {isPM && showAdd && !editId && (
          <MemberForm title="새 팀원 초대"
            onSubmit={data => { addMember(data); setShowAdd(false) }}
            onCancel={() => setShowAdd(false)} />
        )}

        {/* 요약 지표 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14 }}>
          {[
            { label: '팀원 수',           value: members.length, unit: '명', sub: '전체 활성' },
            { label: '총 가용 시간',       value: totalCapacity,  unit: 'h',  sub: '이번 계획 기준' },
            { label: '현재 계획 태스크',   value: totalTasks,  unit: '개', sub: `완료 ${doneCount}개` },
            { label: '팀 평균 완료율',    value: completionPct,  unit: '%',  sub: sprint.name },
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

        {/* 팀원 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>팀원</h2>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{members.length}명</span>
          </div>

          {members.map(member => {
            const stats = getMemberStats(member)
            const pct   = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

            if (isPM && editId === member.id) return (
              <MemberForm key={member.id} title="팀원 수정" initial={member}
                onSubmit={data => { updateMember(member.id, data); setEditId(null) }}
                onCancel={() => setEditId(null)} />
            )

            return (
              <div key={member.id} style={{ ...card, overflow: 'hidden' }}
                   onMouseEnter={e => e.currentTarget.style.borderColor = '#D1D5DB'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}>
                <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 16 }}>
                  {/* 아바타 */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: member.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700,
                  }}>{member.initials}</div>

                  {/* 이름 + 역할 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{member.name}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 9999,
                        background: member.color + '18', color: member.color,
                      }}>{member.role}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>{member.email || '이메일 미등록'}</p>
                  </div>

                  {/* 지표 */}
                  <div style={{ display: 'flex', width: isMobile ? '100%' : 'auto', borderTop: isMobile ? '1px solid #E8EAED' : 'none', paddingTop: isMobile ? 10 : 0 }}>
                  {[
                    { label: '가용 시간', value: member.capacity, unit: 'h' },
                    { label: '태스크', value: `${stats.done}/${stats.total}`, unit: '' },
                    { label: '완료 작업량', value: stats.doneSp, unit: `/${stats.sp}`, valueColor: member.color },
                  ].map(({ label, value, unit, valueColor }) => (
                    <div key={label} style={{ textAlign: 'center', flex: isMobile ? 1 : 'none', padding: isMobile ? '0 8px' : '0 16px', borderLeft: '1px solid #E8EAED' }}>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: valueColor || '#111827', lineHeight: 1 }}>
                        {value}<span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF' }}>{unit}</span>
                      </p>
                    </div>
                  ))}
                  </div>

                  {/* 액션 */}
                  {isPM && (
                    <div style={{ display: 'flex', gap: 6, paddingLeft: 16, borderLeft: '1px solid #E8EAED', flexShrink: 0 }}>
                      <button onClick={() => setEditId(member.id)}
                              style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 10, border: '1px solid #E8EAED', background: '#FFF', color: '#4B5563', cursor: 'pointer' }}
                              className="btn-press-soft">수정</button>
                      <button onClick={() => setDeleteId(member.id)}
                              style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 10, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer' }}
                              className="btn-press-soft">삭제</button>
                    </div>
                  )}
                </div>

                {/* 진행률 바 */}
                {stats.total > 0 && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid #F4F5F7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', margin: '12px 0 6px' }}>
                      <span>이번 계획 진행률</span>
                      <span style={{ fontWeight: 600, color: member.color }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: '#E8EAED', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ height: '100%', borderRadius: 2, background: member.color, width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {stats.myTasks.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: t.status === 'done' ? '#10B981' : t.status === 'inprogress' ? '#2563EB' : '#D1D5DB',
                          }} />
                          <span style={{ fontSize: 11, color: '#6B7280', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{t.points}작업량</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {members.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>팀원이 없어요</p>
              <p style={{ fontSize: 13 }}>위 버튼으로 팀원을 초대해보세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 팀원 초대 모달 */}
      {showInvite && (
        <div onClick={() => setShowInvite(false)}
             style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(17,24,39,0.44)' }}>
          <div onClick={e => e.stopPropagation()}
               style={{ background: '#FFF', borderRadius: 20, padding: 28, width: 420, boxShadow: '0 0 20px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>팀원 초대하기</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>아래 팀 코드를 팀원에게 공유하세요. 팀원은 앱 접속 후 코드를 입력해 팀에 합류할 수 있어요.</p>
            </div>

            {/* 팀 코드 */}
            <div style={{ textAlign: 'center', padding: '20px', background: '#EFF6FF', borderRadius: 14, border: '1px solid #BFDBFE' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', marginBottom: 8, letterSpacing: '0.06em' }}>팀 코드</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#1D4ED8', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 12 }}>
                {settings.teamCode}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={copyCode} style={{ ...btnPrimary, height: 36, fontSize: 12, padding: '0 16px' }}>
                  {copied ? '✓ 복사됨' : '코드 복사'}
                </button>
                <button onClick={regenerateCode} style={{ ...btnTertiary, height: 36, fontSize: 12, padding: '0 14px' }}>
                  🔄 재생성
                </button>
              </div>
            </div>

            {/* Discord 웹훅 설정 */}
            <div>
              <label style={labelStyle}>Discord 웹훅 URL (선택 — 알림 발송용)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="url" style={{ ...inputStyle, flex: 1 }}
                  placeholder="https://discord.com/api/webhooks/..."
                  value={webhookInput}
                  onChange={e => setWebhookInput(e.target.value)}
                />
                <button onClick={() => { setDiscordWebhook(webhookInput); setShowInvite(false) }}
                  style={{ ...btnPrimary, height: 40, fontSize: 12, padding: '0 14px', flexShrink: 0 }}>저장</button>
              </div>
            </div>

            {/* 팀원 직접 추가 */}
            <div style={{ borderTop: '1px solid #F4F5F7', paddingTop: 16 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 10 }}>또는 PM이 직접 팀원을 추가할 수도 있어요</p>
              <button onClick={() => { setShowInvite(false); setShowAdd(true); setEditId(null) }} style={{ ...btnTertiary, width: '100%', height: 40, fontSize: 13 }}>
                + 직접 팀원 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div onClick={() => setDeleteId(null)}
             style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(17,24,39,0.44)' }}>
          <div onClick={e => e.stopPropagation()}
               style={{ background: '#FFF', borderRadius: 20, padding: 24, width: 360, boxShadow: '0 0 20px rgba(0,0,0,0.25)' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>팀원을 삭제할까요?</p>
            <p style={{ fontSize: 13, color: '#6B7280', lineHeight: '20px', marginBottom: 20 }}>
              <strong style={{ color: '#111827' }}>{members.find(m => m.id === deleteId)?.name}</strong>님을 팀에서 제외합니다. 이 작업은 되돌릴 수 없어요.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { removeMember(deleteId); setDeleteId(null) }}
                      style={{ flex: 1, height: 48, borderRadius: 14, border: 'none', background: '#DC2626', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      className="btn-press">삭제</button>
              <button onClick={() => setDeleteId(null)}
                      style={{ flex: 1, height: 48, borderRadius: 14, border: '1px solid #E8EAED', background: '#F4F5F7', color: '#1F2937', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      className="btn-press">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
