import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import { useBacklogStore } from '../store/useBacklogStore'
import { useAuthStore } from '../store/useAuthStore'
import { callClaude } from '../utils/claude'

const PRIORITY_OPTIONS = ['Must', 'Should', 'Could', "Won't"]
const CATEGORY_OPTIONS = ['기능', '에픽', 'UI/UX', '인프라', '버그']
const STAGE_OPTIONS    = ['MVP', 'v1.0', 'v2.0']

const PRIORITY_STYLE = {
  Must:    { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  Should:  { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  Could:   { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' },
  "Won't": { bg: '#F4F5F7', color: '#6B7280', border: '#E8EAED' },
}

function analyzeTask(text) {
  const t     = text.trim()
  const lower = t.toLowerCase()

  let category = '기능'
  if (/디자인|UI|UX|화면|레이아웃|색|폰트|아이콘/.test(t))           category = 'UI/UX'
  else if (/API|서버|DB|데이터베이스|인프라|배포|CI|CD|도커|AWS/.test(t)) category = '인프라'
  else if (/버그|오류|에러|수정|픽스|fix/.test(lower))                   category = '버그'
  else if (/에픽|기능 묶음|모듈/.test(t))                               category = '에픽'

  let priority = 'Should'
  if (/로그인|인증|회원|핵심|필수|반드시|꼭|must/.test(lower)) priority = 'Must'
  else if (/나중에|여유|있으면|추후|v2|고도화/.test(lower))    priority = 'Could'
  else if (/없어도|wont|won't/.test(lower))                    priority = "Won't"

  let stage = 'v1.0'
  if (/MVP|핵심|로그인|필수|최소/.test(t))  stage = 'MVP'
  else if (/v2|2버전|고도화|추후/.test(lower)) stage = 'v2.0'

  const isComplex = /연동|API|알고리즘|설계|에픽|모듈/.test(t)
  const isSimple  = /버튼|색상|텍스트|라벨|수정|픽스/.test(t)
  const points    = isSimple ? 2 : isComplex ? 8 : 5

  return { title: t, category, priority, stage, points, desc: '' }
}

const card = { background: '#FFFFFF', border: '1px solid #E8EAED', borderRadius: 16, boxShadow: '0 1px 2px rgba(17,24,39,0.04)' }
const btnPrimary   = { padding: '0 20px', height: 40, borderRadius: 12, border: 'none', background: '#2563EB', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const btnSecondary = { ...btnPrimary, background: '#DBEAFE', color: '#1D4ED8' }
const btnPositive  = { ...btnPrimary, background: '#10B981' }
const selectBase   = { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 9999, border: 'none', cursor: 'pointer', outline: 'none', appearance: 'none' }

export default function CapturePage() {
  const navigate = useNavigate()
  const { add }  = useBacklogStore()
  const { currentUser } = useAuthStore()

  const [input,   setInput]   = useState('')
  const [tasks,   setTasks]   = useState([])
  const [checked, setChecked] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [added,   setAdded]   = useState(false)

  async function handleAnalyze() {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setLoading(true); setTasks([]); setChecked(new Set()); setAdded(false)

    try {
      const system = `당신은 스프린트 플래닝 전문가입니다. 사용자가 입력한 할 일 목록을 분석해서 JSON 배열로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

각 항목을 아래 JSON 형식으로 변환하세요:
[
  {
    "title": "태스크 제목 (간결하게 다듬기)",
    "desc": "한 줄 설명",
    "category": "기능|에픽|UI/UX|인프라|버그 중 하나",
    "priority": "Must|Should|Could|Won't 중 하나",
    "stage": "MVP|v1.0|v2.0 중 하나",
    "points": 숫자 (1~13, 피보나치: 1,2,3,5,8,13)
  }
]

분류 기준:
- priority Must: 없으면 서비스 불가, 핵심 기능
- priority Should: 있으면 좋지만 MVP엔 필수 아님
- priority Could: 여유 있을 때
- stage MVP: 초기 출시에 반드시 필요
- points: 복잡도 기반 (간단=2, 보통=5, 복잡=8, 매우복잡=13)`

      const raw = await callClaude(system, lines.join('\n'))
      const json = JSON.parse(raw.trim())
      const analyzed = json.map((item, idx) => ({ id: idx, ...item }))
      setTasks(analyzed)
      setChecked(new Set(analyzed.map(t => t.id)))
    } catch (e) {
      // API 실패 시 키워드 분석으로 폴백
      const analyzed = lines.map((line, idx) => ({ id: idx, ...analyzeTask(line) }))
      setTasks(analyzed)
      setChecked(new Set(analyzed.map(t => t.id)))
    }

    setLoading(false)
  }

  function toggleCheck(id) {
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function updateTask(id, field, value) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  function handleAddToBacklog() {
    tasks.filter(t => checked.has(t.id)).forEach(t =>
      add({ title: t.title, desc: t.desc, category: t.category, priority: t.priority, stage: t.stage, points: t.points }, currentUser?.id ?? null)
    )
    setAdded(true)
  }

  const lineCount    = input.split('\n').filter(l => l.trim()).length
  const checkedCount = checked.size

  // 비로그인 안내 화면
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Topbar title="아이디어 캡처" subtitle="생각나는 할 일을 자유롭게 입력하면 AI가 백로그 형식으로 정리해줘요" />
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#F4F5F7', gap: 16, padding: 32,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>🔒</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>팀원 선택이 필요해요</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: '22px' }}>
            아이디어 캡처는 개인 기록이에요.<br />
            왼쪽 사이드바에서 팀원을 선택하면 바로 사용할 수 있어요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <Topbar title="아이디어 캡처" subtitle="생각나는 할 일을 자유롭게 입력하면 AI가 백로그 형식으로 정리해줘요">
        {tasks.length > 0 && !added && (
          <button onClick={handleAddToBacklog} disabled={checkedCount === 0}
                  style={{ ...btnPositive, opacity: checkedCount === 0 ? 0.4 : 1 }}
                  className="btn-press">
            백로그에 추가 ({checkedCount}개)
          </button>
        )}
        {added && (
          <button onClick={() => navigate('/backlog')} style={btnSecondary} className="btn-press">
            백로그 확인하기
          </button>
        )}
      </Topbar>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, background: '#F4F5F7' }}>

        {/* 입력 영역 */}
        <div style={{ ...card, padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>할 일 자유 입력</p>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 14, lineHeight: '20px' }}>
            한 줄에 하나씩 입력하세요. 정제되지 않은 텍스트도 괜찮아요.
          </p>
          <textarea
            style={{
              width: '100%', height: 160,
              padding: '12px 14px', boxSizing: 'border-box',
              border: '1px solid #E8EAED', borderRadius: 14,
              background: '#F4F5F7', fontSize: 13, color: '#111827',
              lineHeight: '22px', resize: 'none', outline: 'none',
              fontFamily: 'inherit',
            }}
            placeholder={'구글 로그인 붙여야 함\n백로그 화면에서 필터 기능 추가\n디자인 시안 만들기\nAPI 에러 처리 로직 추가'}
            value={input}
            onChange={e => { setInput(e.target.value); setAdded(false) }}
            onFocus={e => { e.target.style.borderColor = '#BFDBFE'; e.target.style.background = '#FFF' }}
            onBlur={e => { e.target.style.borderColor = '#E8EAED'; e.target.style.background = '#F4F5F7' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{lineCount}개 항목</span>
            <button onClick={handleAnalyze} disabled={loading || !input.trim()}
                    style={{ ...btnPrimary, opacity: (loading || !input.trim()) ? 0.4 : 1 }}
                    className="btn-press">
              {loading ? '분석 중...' : 'AI로 정리하기'}
            </button>
          </div>
        </div>

        {/* 로딩 */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#2563EB',
                  animation: `socarPulse 1.2s ${i*0.2}s infinite`,
                }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>항목을 분석하고 카테고리를 분류하는 중이에요...</p>
            <style>{`@keyframes socarPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.25;transform:scale(0.75)}}`}</style>
          </div>
        )}

        {/* 분석 결과 */}
        {!loading && tasks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* 완료 배너 */}
            {added && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', borderRadius: 14,
                background: '#F0FDF9', border: '1px solid #A7F3D0',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#10B981', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, flexShrink: 0,
                }}>✓</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>백로그에 추가했어요!</p>
                  <p style={{ fontSize: 12, color: '#059669', marginTop: 2 }}>{checkedCount}개 태스크가 백로그에 반영되었습니다.</p>
                </div>
              </div>
            )}

            {/* 컨트롤 바 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  AI 분석 결과{' '}
                  <span style={{ color: '#2563EB' }}>{tasks.length}개</span>
                </p>
                <button
                  onClick={() => setChecked(checkedCount === tasks.length ? new Set() : new Set(tasks.map(t => t.id)))}
                  style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {checkedCount === tasks.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{checkedCount}개 선택됨</span>
            </div>

            {/* 결과 카드 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.map(task => {
                const isOn = checked.has(task.id)
                const ps   = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE["Won't"]
                return (
                  <div key={task.id} style={{
                    ...card,
                    padding: '16px 18px',
                    borderColor: isOn ? '#BFDBFE' : '#E8EAED',
                    opacity: isOn ? 1 : 0.5,
                    transition: 'opacity 150ms, border-color 150ms',
                    boxShadow: isOn ? '0 0 0 2px rgba(37,99,235,0.06)' : '0 1px 2px rgba(17,24,39,0.04)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                      {/* 체크박스 */}
                      <button onClick={() => toggleCheck(task.id)} style={{
                        width: 20, height: 20, marginTop: 2, borderRadius: 5, flexShrink: 0,
                        border: isOn ? 'none' : '1.5px solid #D1D5DB',
                        background: isOn ? '#2563EB' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }} className="btn-press-soft">
                        {isOn && <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>✓</span>}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* 제목 */}
                        <input
                          style={{
                            width: '100%', fontSize: 13, fontWeight: 600, color: '#111827',
                            background: 'transparent', border: 'none', borderBottom: '1px solid transparent',
                            outline: 'none', paddingBottom: 4, marginBottom: 8, boxSizing: 'border-box',
                          }}
                          value={task.title}
                          onChange={e => updateTask(task.id, 'title', e.target.value)}
                          onFocus={e => e.target.style.borderBottomColor = '#BFDBFE'}
                          onBlur={e => e.target.style.borderBottomColor = 'transparent'}
                        />

                        {/* 설명 */}
                        <input
                          style={{
                            width: '100%', fontSize: 12, color: '#9CA3AF',
                            background: 'transparent', border: 'none', borderBottom: '1px solid transparent',
                            outline: 'none', paddingBottom: 4, marginBottom: 12, boxSizing: 'border-box',
                          }}
                          placeholder="설명 추가 (선택)"
                          value={task.desc}
                          onChange={e => updateTask(task.id, 'desc', e.target.value)}
                          onFocus={e => e.target.style.borderBottomColor = '#BFDBFE'}
                          onBlur={e => e.target.style.borderBottomColor = 'transparent'}
                        />

                        {/* 메타 태그 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <select value={task.priority} onChange={e => updateTask(task.id, 'priority', e.target.value)}
                                  style={{ ...selectBase, background: ps.bg, color: ps.color }}>
                            {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                          </select>

                          <select value={task.category} onChange={e => updateTask(task.id, 'category', e.target.value)}
                                  style={{ ...selectBase, background: '#F4F5F7', color: '#4B5563' }}>
                            {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                          </select>

                          <select value={task.stage} onChange={e => updateTask(task.id, 'stage', e.target.value)}
                                  style={{ ...selectBase, background: '#EFF6FF', color: '#2563EB' }}>
                            {STAGE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                            <input type="number" min="1" max="100"
                              value={task.points}
                              onChange={e => updateTask(task.id, 'points', Number(e.target.value))}
                              style={{
                                width: 36, fontSize: 12, fontWeight: 700, color: '#4B5563',
                                textAlign: 'center', background: 'transparent',
                                border: 'none', borderBottom: '1px solid #E8EAED',
                                outline: 'none',
                              }}
                              onFocus={e => e.target.style.borderBottomColor = '#BFDBFE'}
                              onBlur={e => e.target.style.borderBottomColor = '#E8EAED'}
                            />
                            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>작업량</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 하단 추가 버튼 */}
            {!added && (
              <button onClick={handleAddToBacklog} disabled={checkedCount === 0}
                      style={{
                        width: '100%', height: 50, borderRadius: 14, border: 'none',
                        background: '#2563EB', color: 'white',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        opacity: checkedCount === 0 ? 0.4 : 1,
                      }}
                      className="btn-press">
                선택한 {checkedCount}개 백로그에 추가하기
              </button>
            )}
          </div>
        )}

        {/* 초기 안내 */}
        {!loading && tasks.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 4,
            }}>AI</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>생각나는 할 일을 던져보세요</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: '22px', maxWidth: 340 }}>
              "구글 로그인 붙여야 함", "디자인 시안 만들기" 처럼<br />
              정제되지 않은 텍스트도 괜찮아요.<br />
              AI가 우선순위·카테고리·SP를 자동으로 분류해드립니다.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
