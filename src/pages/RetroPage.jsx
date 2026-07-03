import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'
import { useAuthStore } from '../store/useAuthStore'
import { useTeamStore } from '../store/useTeamStore'

const SECTIONS = [
  { key: 'liked',   label: '👍 Liked',      desc: '잘 됐던 것, 좋았던 것',              color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0' },
  { key: 'learned', label: '📚 Learned',    desc: '새롭게 배운 것, 인사이트',            color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'lacked',  label: '😓 Lacked',     desc: '부족했던 것, 아쉬웠던 점',            color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { key: 'longed',  label: '🚀 Longed for', desc: '다음에 해보고 싶은 것, 개선 아이디어', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
]

const DEFAULT_ENTRIES = {
  liked: [
    { id: 1, author: '곽예리', role: 'PM',        color: '#2563EB', initials: '곽', text: 'AI가 백로그를 자동 분류해주니까 기획 속도가 확실히 빨라졌어요.' },
    { id: 2, author: '김서연', role: '프론트엔드', color: '#22C55E', initials: '김', text: 'SOCAR 디자인 시스템 덕분에 UI 일관성이 잘 유지됐어요.' },
    { id: 3, author: '박준혁', role: '백엔드',     color: '#2563EB', initials: '박', text: '역할별 권한 분리가 명확해서 개발하기 좋았습니다.' },
  ],
  learned: [
    { id: 4, author: '이민수', role: 'AI/백엔드',  color: '#8B5CF6', initials: '이', text: 'Zustand 패턴 없이도 커스텀 훅으로 상태 관리가 충분히 가능하다는 걸 배웠어요.' },
    { id: 5, author: '곽예리', role: 'PM',        color: '#2563EB', initials: '곽', text: '인터뷰를 먼저 했어야 했는데, 만들고 나서 하니까 방향 수정이 필요한 부분이 생겼어요.' },
  ],
  lacked: [
    { id: 6, author: '최지은', role: '디자인',     color: '#F59E0B', initials: '최', text: '모바일 반응형을 처음부터 고려했어야 했는데 PC 전용으로 만들어버렸어요.' },
    { id: 7, author: '박준혁', role: '백엔드',     color: '#2563EB', initials: '박', text: 'localStorage로만 구현해서 팀원 간 실시간 동기화가 안 됩니다.' },
  ],
  longed: [
    { id: 8,  author: '곽예리', role: 'PM',        color: '#2563EB', initials: '곽', text: 'Supabase 연동으로 실제 멀티 유저 환경 구현해보고 싶어요.' },
    { id: 9,  author: '이민수', role: 'AI/백엔드',  color: '#8B5CF6', initials: '이', text: 'Claude API 실제 연동해서 AI 플래닝 차별점을 제대로 보여주고 싶습니다.' },
    { id: 10, author: '김서연', role: '프론트엔드', color: '#22C55E', initials: '김', text: '에듀 시장 교수용 대시보드도 만들어보고 싶어요.' },
  ],
}

// 더미 AI 회고 결과 (USE_MOCK=true일 때 사용) — summary만 실제 완료율로 채움
function buildMockSummary(pct, doneCount, totalCount) {
  const tone = pct >= 70 ? '목표를 무난히 달성한' : pct >= 40 ? '목표 대비 다소 아쉬운' : '목표 대비 진행이 더뎠던'
  return `이번 계획은 ${tone} 스프린트였습니다. 완료율 ${pct}%(${doneCount}/${totalCount}개)로, Must 태스크 중심으로 진행되어 핵심 기능의 품질은 유지됐습니다.`
}

const MOCK_AI_RETRO = {
  liked:   '역할별 권한 분리와 SOCAR 디자인 시스템 적용으로 UI 일관성과 개발 효율이 모두 높았습니다. 특히 PM 주도의 백로그 관리가 팀 방향성을 잘 잡아줬습니다.',
  learned: '인터뷰를 개발 이후에 진행하면서 방향 수정이 필요한 부분이 발생했습니다. 다음 스프린트부터는 기획-검증-개발 순서를 지키는 것이 중요합니다.',
  lacked:  'AI 태스크 분해 API 연동(t13)과 스프린트 확정 화면(t14)이 inprogress 상태에서 진행률 0%로 블로커가 됐습니다. 이민수님의 13작업량 태스크가 Sprint 1 후반 리스크였습니다.',
  longed:  '다음 스프린트에서는 Supabase 연동으로 실제 멀티유저 환경을 구현하고, Claude API를 실제 연동하여 AI 플래닝 차별점을 사용자에게 직접 보여줄 수 있어야 합니다.',
  nextActions: [
    'AI 태스크 분해 API 연동 — 이민수 (블로커 해소 최우선)',
    'Supabase 스키마 설계 및 Auth 연동 — 박준혁',
    '에듀 시장 교수용 대시보드 기획 — 곽예리',
    'Claude API USE_MOCK → false 전환 후 실제 테스트 — 이민수',
  ],
}

const card = {
  background: '#FFFFFF',
  borderRadius: 16,
  border: '1px solid #E8EAED',
  boxShadow: '0 1px 2px rgba(17,24,39,0.04)',
}

function Avatar({ initials, color, size = 28, fontSize = 11 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff',
    }}>{initials}</div>
  )
}

export default function RetroPage() {
  const { sprint }       = useSprintStore()
  const { currentUser }  = useAuthStore()
  const { members }      = useTeamStore()
  const navigate         = useNavigate()
  const isPM             = currentUser?.role === 'PM'

  const [entries,   setEntries]   = useState(DEFAULT_ENTRIES)
  const [inputs,    setInputs]    = useState({ liked: '', learned: '', lacked: '', longed: '' })
  const [saved,     setSaved]     = useState(null)
  const [aiRetro,   setAiRetro]   = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const tasks    = sprint.tasks
  const done     = tasks.filter(t => t.status === 'done')
  const totalH   = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const doneH    = done.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const pct      = totalH > 0 ? Math.round((doneH / totalH) * 100) : 0
  const blockers = tasks.filter(t => t.status === 'inprogress' && t.progress === 0)

  function handleAdd(key) {
    const text = inputs[key].trim()
    if (!text || !currentUser) return
    setEntries(prev => ({
      ...prev,
      [key]: [...prev[key], {
        id: Date.now(), text,
        author:   currentUser.name,
        role:     currentUser.role,
        color:    currentUser.color,
        initials: currentUser.initials,
      }],
    }))
    setInputs(prev => ({ ...prev, [key]: '' }))
    setSaved(key)
    setTimeout(() => setSaved(null), 1500)
  }

  async function handleGenerateAI() {
    setAiLoading(true)
    setAiRetro(null)
    // ponytail: mock delay — swap callClaude when USE_MOCK=false
    await new Promise(r => setTimeout(r, 2000))
    setAiRetro({ ...MOCK_AI_RETRO, summary: buildMockSummary(pct, done.length, tasks.length) })
    setAiLoading(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="이번 계획 회고" subtitle={`${sprint.name} · 4L 회고`}>
        {isPM && (
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading}
            style={{
              padding: '0 18px', height: 36, borderRadius: 10, border: 'none',
              background: aiLoading ? '#93C5FD' : '#2563EB',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: aiLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {aiLoading ? '⏳ AI 회고 초안 만드는 중...' : '✨ AI 회고 초안 만들기'}
          </button>
        )}
      </Topbar>

      <div style={{
        flex: 1, overflowY: 'auto', background: '#F9FAFB',
        padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* 이번 계획 결과 요약 */}
        <div style={{ ...card, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            이번 계획 결과 요약
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: '완료 업무',   value: done.length,  unit: `/${tasks.length}개` },
              { label: '완료 시간',   value: doneH,        unit: `/${totalH}시간` },
              { label: '완료율',      value: pct,          unit: '%' },
              { label: '미완료 블로커', value: blockers.length, unit: '개', warn: blockers.length > 0 },
            ].map(({ label, value, unit, warn }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: warn ? '#EF4444' : '#111827' }}>
                  {value}<span style={{ fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>{unit}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 회고 결과 */}
        {aiRetro && (
          <div style={{ ...card, padding: '20px 24px', border: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 16 }}>✨</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8' }}>AI 회고 분석 결과</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 4 }}>PM 전용 생성 · 팀원 열람 가능</span>
            </div>

            {/* 종합 요약 */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 6 }}>종합 요약</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{aiRetro.summary}</div>
            </div>

            {/* 4L AI 분석 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {SECTIONS.map(({ key, label, color, bg, border }) => (
                <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{aiRetro[key]}</div>
                </div>
              ))}
            </div>

            {/* 다음 스프린트 액션 */}
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', marginBottom: 10 }}>🎯 다음 계획 액션 아이템</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {aiRetro.nextActions.map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#374151' }}>
                    <span style={{ color: '#8B5CF6', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PM에게만 보이는 생성 유도 */}
        {isPM && !aiRetro && !aiLoading && (
          <div style={{ ...card, padding: '20px 24px', border: '1px dashed #BFDBFE', background: '#F0F9FF', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1D4ED8', marginBottom: 6 }}>AI 회고 생성</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
              이번 계획 완료율, 블로커, 팀 활동을 분석해 AI가 회고 초안을 만들어드려요
            </div>
            <button onClick={handleGenerateAI} style={{
              padding: '0 24px', height: 40, borderRadius: 10, border: 'none',
              background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              AI 회고 초안 만들기
            </button>
          </div>
        )}

        {/* PM 전용 — 팀 참여 현황 배너 */}
        {isPM && (() => {
          const totalMembers = members.length
          const participatingMembers = new Set(
            SECTIONS.flatMap(s => entries[s.key].map(e => e.author))
          ).size
          const fullyDone = members.filter(m =>
            SECTIONS.every(s => entries[s.key].some(e => e.author === m.name))
          ).length
          if (totalMembers === 0) return null
          return (
            <div style={{ padding: '14px 18px', borderRadius: 14, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>👥</span>
                <p style={{ fontSize: 13, color: '#6D28D9' }}>
                  <strong>팀원 {totalMembers}명 중 {participatingMembers}명</strong>이 참여 중 · 전체 완료 <strong>{fullyDone}명</strong>
                </p>
              </div>
              {participatingMembers >= totalMembers && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9999, background: '#8B5CF6', color: '#fff', flexShrink: 0 }}>
                  AI 회고 생성 추천 ✨
                </span>
              )}
            </div>
          )
        })()}

        {/* 팀원 안내 배너 — 로그인한 팀원에게만 */}
        {currentUser && !isPM && (() => {
          const myEntries = SECTIONS.filter(s => entries[s.key].some(e => e.author === currentUser.name))
          const remaining = SECTIONS.length - myEntries.length
          if (remaining === 0) return (
            <div style={{ padding: '14px 18px', borderRadius: 14, background: '#F0FDF9', border: '1px solid #A7F3D0', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>4개 섹션 모두 작성 완료했어요! PM이 AI 회고를 생성하면 여기서 결과를 볼 수 있어요.</p>
            </div>
          )
          return (
            <div style={{ padding: '14px 18px', borderRadius: 14, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>✏️</span>
              <p style={{ fontSize: 13, color: '#1D4ED8' }}>
                <strong>{currentUser.name}님</strong>, 아직 {remaining}개 섹션에 의견이 없어요. 각 섹션 아래 입력창에 작성해주세요.
              </p>
            </div>
          )
        })()}

        {/* 4L 팀원 의견 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {SECTIONS.map(({ key, label, desc, color, bg, border }) => {
            const myEntry = currentUser ? entries[key].find(e => e.author === currentUser.name) : null
            const needsInput = currentUser && !isPM && !myEntry

            return (
              <div key={key} style={{
                ...card, overflow: 'hidden',
                outline: needsInput ? `2px solid ${color}` : 'none',
                outlineOffset: 2,
              }}>
                <div style={{
                  padding: '14px 18px', borderBottom: '1px solid #F3F4F6',
                  borderLeft: `4px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {needsInput && (
                      <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${border}`, padding: '2px 7px', borderRadius: 9999 }}>미작성</span>
                    )}
                    {myEntry && !isPM && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#D1FAE5', border: '1px solid #A7F3D0', padding: '2px 7px', borderRadius: 9999 }}>작성 완료</span>
                    )}
                    {/* PM용: 팀원 작성 현황 */}
                    {isPM && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>
                        {new Set(entries[key].map(e => e.author)).size}명 작성
                      </span>
                    )}
                    <span style={{
                      fontSize: 12, fontWeight: 700, color,
                      background: bg, border: `1px solid ${border}`,
                      padding: '2px 10px', borderRadius: 9999,
                    }}>{entries[key].length}개</span>
                  </div>
                </div>

                <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 100 }}>
                  {entries[key].map(e => (
                    <div key={e.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Avatar initials={e.initials} color={e.color} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{e.author} · {e.role}</span>
                          {e.role === 'PM' && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE', flexShrink: 0 }}>PM</span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{e.text}</div>
                      </div>
                    </div>
                  ))}

                  {currentUser ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 4 }}>
                      <Avatar initials={currentUser.initials} color={currentUser.color} />
                      <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                        <input
                          value={inputs[key]}
                          onChange={e => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAdd(key)}
                          placeholder={needsInput ? '의견을 남겨주세요 (Enter로 등록)' : '추가 의견이 있으면 남겨보세요...'}
                          style={{
                            flex: 1, fontSize: 13, padding: '8px 12px',
                            borderRadius: 10, border: `1px solid ${needsInput ? color : '#E8EAED'}`,
                            outline: 'none', color: '#111827',
                            background: needsInput ? bg : '#FFFFFF',
                          }}
                        />
                        <button onClick={() => handleAdd(key)} style={{
                          padding: '0 14px', height: 36, borderRadius: 10, border: 'none',
                          background: saved === key ? '#10B981' : color,
                          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          flexShrink: 0, transition: 'background 0.2s',
                        }}>
                          {saved === key ? '✓' : '등록'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                      왼쪽 메뉴에서 팀원을 선택하면 의견을 남길 수 있어요
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 새 스프린트 시작 — PM만 */}
        {isPM && (
          <div style={{
            background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 16,
            padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>회고가 끝났나요?</p>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>다음 계획을 시작해보세요. 전체 할 일에 이월된 태스크가 준비돼 있어요.</p>
            </div>
            <button onClick={() => navigate('/sprint/builder')} style={{
              padding: '0 24px', height: 42, borderRadius: 12, border: 'none',
              background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            }}>
              새 계획 시작 →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
