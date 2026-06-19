import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore } from '../store/useBacklogStore'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'

/* SOCAR 기반 우선순위 스타일 */
const PRIORITY_STYLE = {
  Must:   { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should: { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:  { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't":{ bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

const MEMBERS = [
  { id: 'a', name: '박준혁', role: '백엔드',    color: '#2563EB', initials: '박', hours: 64, total: 80 },
  { id: 'b', name: '김서연', role: '프론트',    color: '#10B981', initials: '김', hours: 60, total: 80 },
  { id: 'c', name: '이민수', role: 'AI/백엔드', color: '#7C3AED', initials: '이', hours: 48, total: 80 },
  { id: 'd', name: '최지은', role: '디자인',    color: '#D97706', initials: '최', hours: 40, total: 80 },
]

const TASK_META = {
  '소셜 로그인 (구글)': { reason: '모든 기능의 전제 조건 — 가장 먼저 완료 필요', week: 1, memberId: 'a' },
  '팀 생성 및 초대':    { reason: '백로그·AI 기능이 팀 컨텍스트를 필요로 함',   week: 1, memberId: 'a' },
  '백로그 CRUD':        { reason: 'AI 빌더의 입력 데이터 소스 — 선행 필요',       week: 1, memberId: 'b' },
  'Capacity 입력':      { reason: 'AI 배분 알고리즘의 핵심 입력값',               week: 1, memberId: 'b' },
  'AI 스프린트 빌더':   { reason: 'SprintAI 핵심 차별점 — AI 경험 활용',          week: 2, memberId: 'c' },
  'AI 태스크 분해기':   { reason: '에픽 → 태스크 자동 분해로 백로그 품질 향상',    week: 2, memberId: 'c' },
  '칸반 보드':          { reason: '스프린트 실행을 위한 필수 인터페이스',          week: 2, memberId: 'b' },
  '스프린트 대시보드':  { reason: 'PM 모니터링 화면 — Must 완료 후 작업',         week: 2, memberId: 'd' },
}

function buildResult(selectedItems, capacity) {
  const totalSP  = selectedItems.reduce((s, i) => s + i.points, 0)
  const totalCap = Object.values(capacity).reduce((s, h) => s + h, 0)
  const tasks = selectedItems.map(item => {
    const meta = TASK_META[item.title] || { reason: '우선순위와 의존성을 고려해 배정', week: 2, memberId: 'a' }
    return { ...item, week: meta.week, reason: meta.reason, member: MEMBERS.find(m => m.id === meta.memberId) || MEMBERS[0] }
  })
  return {
    confidence: 87, totalSP,
    summary: `팀 총 Capacity ${totalCap}h, 스프린트 목표 30sp 기준. 인증-팀 기반이 선행되어야 AI 기능 개발이 가능한 의존 관계를 반영했어요. 이민수님의 AI 도메인 전문성을 고려해 AI 스프린트 빌더를 우선 배정했습니다.`,
    week1: tasks.filter(t => t.week === 1),
    week2: tasks.filter(t => t.week === 2),
  }
}

/* 공통 버튼 스타일 */
const btnPrimary = {
  padding: '0 20px', height: 40, borderRadius: 12, border: 'none',
  background: '#2563EB', color: 'white',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6,
  transition: 'transform 100ms',
}
const btnSecondary = {
  ...btnPrimary, background: '#DBEAFE', color: '#1D4ED8',
}
const btnTertiary = {
  ...btnPrimary, background: '#F4F5F7', color: '#1F2937',
  border: '1px solid #E8EAED',
}

/* 카드 공통 */
const card = {
  background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 16,
  boxShadow: '0 1px 2px rgba(17,24,39,0.04)',
}

function LockedOverlay({ message }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(2px)',
      borderRadius: 'inherit',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: '#F4F5F7', border: '1px solid #E8EAED',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>🔒</div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#4B5563', textAlign: 'center', maxWidth: 200 }}>{message}</p>
      <p style={{ fontSize: 12, color: '#9CA3AF' }}>PM 역할만 사용할 수 있어요</p>
    </div>
  )
}

export default function SprintBuilderPage() {
  const navigate = useNavigate()
  const { items } = useBacklogStore()
  const { confirmSprint } = useSprintStore()
  const { currentUser, can } = useAuthStore()

  const [selected, setSelected] = useState(
    () => new Set(items.filter(i => i.priority === 'Must' && i.stage === 'MVP').map(i => i.id))
  )
  const [capacity, setCapacity] = useState(
    () => Object.fromEntries(MEMBERS.map(m => [m.id, m.hours]))
  )
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const resultRef = useRef(null)

  const selectedItems = items.filter(i => selected.has(i.id))
  const selectedSP    = selectedItems.reduce((s, i) => s + i.points, 0)
  const filtered      = items.filter(i => i.title.includes(search) || i.desc?.includes(search))

  function toggleItem(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function handleReset() {
    setResult(null)
    setSelected(new Set(items.filter(i => i.priority === 'Must' && i.stage === 'MVP').map(i => i.id)))
    setCapacity(Object.fromEntries(MEMBERS.map(m => [m.id, m.hours])))
  }

  async function handleGenerate() {
    if (selected.size === 0) return
    setLoading(true); setResult(null)
    await new Promise(r => setTimeout(r, 2000))
    setResult(buildResult(selectedItems, capacity))
    setLoading(false)
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Topbar title="AI 스프린트 빌더" subtitle="백로그를 선택하면 AI가 최적 스프린트를 설계해줘요">
        {/* 로그인 상태 표시 */}
        {!currentUser && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 9999,
            background: '#FEF3C7', border: '1px solid #FDE68A',
            fontSize: 12, fontWeight: 600, color: '#D97706',
          }}>
            팀원을 선택해야 이용할 수 있어요
          </div>
        )}
        {currentUser && !can.runAI && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 9999,
            background: '#F4F5F7', border: '1px solid #E8EAED',
            fontSize: 12, fontWeight: 600, color: '#6B7280',
          }}>
            {currentUser.name} ({currentUser.role}) — 보기만 가능
          </div>
        )}
        {can.deleteSprint && (
          <button onClick={handleReset} style={btnTertiary} className="btn-press">초기화</button>
        )}
        <button onClick={handleGenerate}
                disabled={loading || selected.size === 0 || !can.runAI}
                style={{ ...btnPrimary, opacity: (loading || selected.size === 0 || !can.runAI) ? 0.4 : 1, position: 'relative' }}
                title={!can.runAI ? 'PM 역할만 실행할 수 있어요' : ''}
                className="btn-press">
          {!can.runAI && <span style={{ fontSize: 12 }}>🔒</span>}
          {loading ? '분석 중...' : 'AI 스프린트 생성'}
        </button>
        {result && (
          <button onClick={() => {
            if (!can.confirmSprint) return
            confirmSprint('Sprint 1 — 핵심 AI 기능', [...result.week1, ...result.week2])
            navigate('/sprint/1/board')
          }}
                  disabled={!can.confirmSprint}
                  style={{ ...btnSecondary, opacity: can.confirmSprint ? 1 : 0.4, position: 'relative' }}
                  title={!can.confirmSprint ? 'PM 역할만 확정할 수 있어요' : ''}
                  className="btn-press">
            {!can.confirmSprint && <span style={{ fontSize: 12 }}>🔒</span>}
            스프린트 확정
          </button>
        )}
      </Topbar>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* 왼쪽: 백로그 */}
        <aside style={{
          width: 300, minWidth: 300,
          display: 'flex', flexDirection: 'column',
          background: '#FFFFFF', borderRight: '1px solid #E8EAED',
        }}>
          {/* 헤더 */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #E8EAED' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>백로그</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#4B5563',
                  background: '#F4F5F7', border: '1px solid #E8EAED',
                  padding: '1px 7px', borderRadius: 9999,
                }}>{items.length}개</span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, color: '#2563EB',
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                padding: '3px 10px', borderRadius: 9999,
              }}>{selected.size}개 · {selectedSP}sp</span>
            </div>
            <input
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #E8EAED', borderRadius: 14,
                background: '#F4F5F7', fontSize: 13, color: '#1F2937',
                outline: 'none', boxSizing: 'border-box',
              }}
              placeholder="태스크 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
              onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }}
            />
          </div>

          {/* 목록 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(item => {
              const on = selected.has(item.id)
              const ps = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE["Won't"]
              return (
                <div key={item.id} onClick={() => toggleItem(item.id)}
                     style={{
                       padding: '11px 14px', borderRadius: 12, cursor: 'pointer',
                       border: `1px solid ${on ? '#BFDBFE' : '#E8EAED'}`,
                       background: on ? '#EFF6FF' : '#FFFFFF',
                       transition: 'all 100ms',
                     }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: on ? 'none' : '1.5px solid #D1D5DB',
                      background: on ? '#2563EB' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <span style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, flexShrink: 0,
                      padding: '1px 7px', borderRadius: 9999,
                      background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                    }}>{item.priority}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 24, gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#6B7280', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, flexShrink: 0 }}>{item.points}sp</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 하단 요약 */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid #E8EAED', background: '#F4F5F7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: '#6B7280' }}>선택된 태스크</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{selected.size}개</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>총 스토리 포인트</span>
              <span style={{ fontWeight: 600, color: '#2563EB' }}>{selectedSP}sp</span>
            </div>
          </div>
        </aside>

        {/* 오른쪽: Capacity + AI 결과 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#F4F5F7', padding: '20px 24px', gap: 18, minWidth: 0 }}>

          {/* Capacity 카드 */}
          <div style={{ ...card, padding: 20, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#2563EB', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 18, fontWeight: 700,
              }}>C</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>팀 Capacity 설정</p>
                <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  스프린트 기간: 2주 (2026.07.01 ~ 07.14) · 총 선택 태스크:{' '}
                  <strong style={{ color: '#1F2937' }}>{selectedSP}sp</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {MEMBERS.map(m => {
                const h = capacity[m.id]
                const pct = Math.round((h / m.total) * 100)
                return (
                  <div key={m.id} style={{ border: '1px solid #E8EAED', borderRadius: 14, padding: '14px 14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: m.color, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                      }}>{m.initials}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{m.role}</p>
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#E8EAED', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: '100%', borderRadius: 3, background: m.color, width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                      <span style={{ color: '#9CA3AF' }}>가용 시간</span>
                      <span style={{ fontWeight: 600, color: '#4B5563' }}>
                        <strong style={{ fontWeight: 700, color: '#111827' }}>{h}</strong>h / {m.total}h
                      </span>
                    </div>
                    <input type="range" min="0" max={m.total} step="4" value={h}
                           onChange={e => setCapacity(p => ({ ...p, [m.id]: Number(e.target.value) }))}
                           style={{ width: '100%', accentColor: m.color, cursor: 'pointer' }} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI 결과 영역 */}
          <div ref={resultRef} style={{
            ...card,
            flex: 1, minHeight: 280,
            borderColor: result ? '#BFDBFE' : '#E8EAED',
            overflow: 'hidden',
            position: 'relative',
          }}>

            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, minHeight: 280 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 10, height: 10, borderRadius: '50%', background: '#2563EB',
                      animation: `socarPulse 1.2s ${i*0.2}s infinite`,
                    }} />
                  ))}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>AI가 스프린트를 설계하고 있어요</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF' }}>백로그와 Capacity를 분석 중...</p>
                </div>
                <style>{`@keyframes socarPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.25;transform:scale(0.75)}}`}</style>
              </div>
            )}

            {!loading && !result && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: '0 32px', minHeight: 280, textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 4,
                }}>AI</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>AI 스프린트를 생성해볼까요?</p>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: '20px', maxWidth: 320 }}>
                  왼쪽에서 태스크를 선택하고 Capacity를 설정한 뒤<br />
                  <span style={{ color: '#2563EB', fontWeight: 600 }}>AI 스프린트 생성</span> 버튼을 눌러보세요
                </p>
              </div>
            )}

            {!loading && result && (
              <>
                {/* 결과 헤더 */}
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid #E8EAED',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#FAFBFF',
                }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                    AI 스프린트 제안 — Sprint 1
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{result.totalSP}sp 분석 완료</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: '#2563EB',
                      background: '#EFF6FF', border: '1px solid #BFDBFE',
                      padding: '3px 10px', borderRadius: 9999,
                    }}>신뢰도 {result.confidence}%</span>
                  </div>
                </div>

                {/* AI 판단 근거 */}
                <div style={{
                  margin: '16px 20px 14px',
                  padding: '12px 14px', borderRadius: 12,
                  background: '#EFF6FF', borderLeft: '3px solid #2563EB',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', marginBottom: 5 }}>AI 판단 근거</p>
                  <p style={{ fontSize: 13, color: '#1F2937', lineHeight: '20px' }}>{result.summary}</p>
                </div>

                {/* 주차별 태스크 */}
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    { label: 'WEEK 1 — 인증 & 팀 기반', tasks: result.week1 },
                    { label: 'WEEK 1-2 — 백로그 & CAPACITY', tasks: result.week2 },
                  ].map(({ label, tasks }) => tasks.length > 0 && (
                    <div key={label}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#2563EB',
                          background: '#EFF6FF', padding: '1px 7px', borderRadius: 9999,
                        }}>{tasks.reduce((s, t) => s + t.points, 0)}SP</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {tasks.map(task => (
                          <div key={task.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '11px 14px', borderRadius: 12,
                            border: '1px solid #E8EAED', background: '#FFFFFF',
                          }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                              background: '#2563EB',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{task.title}</p>
                              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{task.reason}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: '50%',
                                  background: task.member.color, color: 'white',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10, fontWeight: 700,
                                }}>{task.member.initials}</div>
                                <span style={{ fontSize: 12, color: '#4B5563', fontWeight: 500 }}>{task.member.name}</span>
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 600, color: '#4B5563',
                                background: '#F4F5F7', padding: '2px 8px', borderRadius: 9999,
                              }}>{task.points}sp</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button onClick={() => {
                    if (!can.confirmSprint) return
                    confirmSprint('Sprint 1 — 핵심 AI 기능', [...result.week1, ...result.week2])
                    navigate('/sprint/1/board')
                  }}
                          disabled={!can.confirmSprint}
                          style={{ ...btnPrimary, width: '100%', justifyContent: 'center', height: 48, borderRadius: 14, fontSize: 14, marginTop: 4, opacity: can.confirmSprint ? 1 : 0.5 }}
                          title={!can.confirmSprint ? 'PM 역할만 스프린트를 확정할 수 있어요' : ''}
                          className="btn-press">
                    {!can.confirmSprint && <span>🔒</span>}
                    이 스프린트로 시작하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
