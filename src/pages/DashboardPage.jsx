import Topbar from '../components/layout/Topbar'
import { useSprintStore } from '../store/useSprintStore'

const CAPACITY = {
  '박준혁': { used: 48, total: 64, color: '#2E75B6' },
  '김서연': { used: 28, total: 60, color: '#22C55E' },
  '이민수': { used: 12, total: 48, color: '#8B5CF6' },
  '최지은': { used: 26, total: 40, color: '#F59E0B' },
}

const cardStyle = {
  background: '#fff',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

function MetricCard({ label, value, unit, sub, subColor, trend }) {
  return (
    <div style={{ ...cardStyle, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 18, fontWeight: 400, color: '#94A3B8', marginLeft: 2 }}>{unit}</span>}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: subColor || '#94A3B8', marginTop: 5 }}>
          {trend && <span style={{ fontWeight: 700 }}>{trend} </span>}
          {sub}
        </div>
      )}
    </div>
  )
}

function BurndownChart({ tasks }) {
  const totalSP = tasks.reduce((s, t) => s + (t.points || 0), 0)
  return (
    <svg viewBox="0 0 500 160" style={{ width: '100%', height: 160 }}>
      <defs>
        <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1"/>
        </pattern>
        <linearGradient id="bluefill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E75B6"/>
          <stop offset="100%" stopColor="#2E75B6" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <rect width="500" height="160" fill="url(#grid)"/>
      <line x1="30" y1="15" x2="470" y2="145" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5,3"/>
      <polyline points="30,15 80,18 130,25 180,42 230,55 280,75 330,85"
        fill="none" stroke="#2E75B6" strokeWidth="2.5" strokeLinejoin="round"/>
      <polyline points="330,85 380,105 430,125 470,145"
        fill="none" stroke="#2E75B6" strokeWidth="2" strokeDasharray="4,3" opacity="0.5"/>
      <path d="M30,15 80,18 130,25 180,42 230,55 280,75 330,85 330,160 30,160Z"
        fill="url(#bluefill)" opacity="0.08"/>
      <circle cx="330" cy="85" r="5" fill="#2E75B6" stroke="white" strokeWidth="2"/>
      <text x="30"  y="155" fontSize="10" fill="#94A3B8">D+0</text>
      <text x="130" y="155" fontSize="10" fill="#94A3B8">D+3</text>
      <text x="230" y="155" fontSize="10" fill="#94A3B8">D+6</text>
      <text x="310" y="155" fontSize="10" fill="#2E75B6" fontWeight="bold">D+8 (오늘)</text>
      <text x="430" y="155" fontSize="10" fill="#94A3B8">D+14</text>
      <text x="35"  y="15"  fontSize="10" fill="#94A3B8">{totalSP}sp</text>
      <text x="35"  y="150" fontSize="10" fill="#94A3B8">0sp</text>
      <line x1="360" y1="12" x2="380" y2="12" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="384" y="16" fontSize="10" fill="#94A3B8">이상적</text>
      <line x1="420" y1="12" x2="440" y2="12" stroke="#2E75B6" strokeWidth="2"/>
      <text x="444" y="16" fontSize="10" fill="#2E75B6">실제</text>
    </svg>
  )
}

function DashCard({ title, right, children }) {
  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{title}</span>
        {right && <span style={{ fontSize: 12, color: '#94A3B8' }}>{right}</span>}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  )
}

function Avatar({ initials, color, size = 24, fontSize = 10 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function SpChip({ points }) {
  return (
    <span style={{
      background: '#F1F5F9', color: '#64748B',
      fontSize: 11, fontWeight: 700,
      padding: '2px 7px', borderRadius: 20,
    }}>
      {points}sp
    </span>
  )
}

export default function DashboardPage() {
  const { sprint } = useSprintStore()
  const tasks = sprint.tasks

  const done       = tasks.filter(t => t.status === 'done')
  const inprogress = tasks.filter(t => t.status === 'inprogress')
  const todo       = tasks.filter(t => t.status === 'todo')

  const totalSP = tasks.reduce((s, t) => s + (t.points || 0), 0)
  const doneSP  = done.reduce((s, t) => s + (t.points || 0), 0)
  const pct     = totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0

  const [ey, em, ed] = sprint.endDate.split('.')
  const endDate = new Date(Number(ey), Number(em) - 1, Number(ed))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((endDate - today) / 86400000)
  const daysLabel = daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day' : '종료'

  const memberMap = {}
  tasks.forEach(t => {
    if (!t.member) return
    const k = t.member.name
    if (!memberMap[k]) memberMap[k] = { member: t.member, tasks: [] }
    memberMap[k].tasks.push(t)
  })
  const members = Object.values(memberMap)

  const bigTodoTask = todo.find(t => t.points >= 13)

  const insights = [
    done.length >= 3 && {
      icon: '✅',
      title: '인증 기반 완성 — 순조로운 출발',
      desc: `로그인·팀 기반 ${done.length}개 태스크가 완료됐어요. 현재 페이스면 AI 기능 개발 일정에 여유가 생깁니다.`,
      border: '#BBF7D0', bg: '#F0FDF4',
    },
    bigTodoTask && {
      icon: '⚠️',
      title: `${bigTodoTask.member?.name}님 대형 태스크 — 주의 필요`,
      desc: `"${bigTodoTask.title}"(${bigTodoTask.points}sp)이 아직 시작 전이에요. 이번 주 착수가 필요합니다.`,
      border: '#FDE68A', bg: '#FFFBEB',
    },
    {
      icon: '💡',
      title: '다음 스프린트 예측',
      desc: `현재 velocity 기준, Sprint 2에서 나머지 ${todo.length}개 태스크(${todo.reduce((s, t) => s + t.points, 0)}sp) 완료가 가능해 보여요.`,
      border: '#DDD6FE', bg: '#F5F3FF',
    },
  ].filter(Boolean)

  const sortedTasks = [...inprogress, ...todo, ...done]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar title="📊 대시보드" subtitle={`${sprint.name} · 업데이트: 방금 전`}>
        <button style={{
          padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
          background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0', cursor: 'pointer',
        }}>
          리포트 내보내기
        </button>
        <button style={{
          padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
          background: 'linear-gradient(135deg, #2E75B6, #8B5CF6)',
          color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ✨ AI 인사이트 보기
        </button>
      </Topbar>

      <div style={{
        flex: 1, overflowY: 'auto', background: '#F8FAFC',
        padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18,
      }}>

        {/* 핵심 지표 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <MetricCard label="스프린트 완료율"      value={pct}      unit="%" sub="목표 대비 순조로움" subColor="#22C55E" trend="↑" />
          <MetricCard label="완료 스토리 포인트"   value={doneSP}   unit={`/${totalSP}`} sub={`남은 포인트: ${totalSP - doneSP}sp`} />
          <MetricCard label="팀 평균 Capacity 소진" value={64}       unit="%" sub="✓ 과부하 없음" subColor="#22C55E" />
          <MetricCard label="D-Day"               value={daysLabel} sub={`${sprint.endDate} 스프린트 종료`} subColor={daysLeft <= 3 ? '#EF4444' : '#94A3B8'} />
        </div>

        {/* 번다운 + Capacity */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <DashCard title="번다운 차트" right="이상적 대비 실제 진행">
            <BurndownChart tasks={tasks} />
          </DashCard>

          <DashCard title="팀원 Capacity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {members.map(({ member }) => {
                const cap = CAPACITY[member.name] || { used: 0, total: 40, color: member.color }
                const p = Math.round((cap.used / cap.total) * 100)
                return (
                  <div key={member.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155' }}>
                        <Avatar initials={member.initials} color={member.color} size={24} fontSize={10} />
                        {member.name}
                      </div>
                      <span style={{ fontSize: 12, color: '#64748B' }}>{cap.used} / {cap.total}h</span>
                    </div>
                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p}%`, background: cap.color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </DashCard>
        </div>

        {/* 태스크 현황 + AI 인사이트 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <DashCard title="스프린트 태스크 현황" right={`${tasks.length}개 태스크`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sortedTasks.map(task => {
                const isInpro = task.status === 'inprogress'
                const isDone  = task.status === 'done'
                return (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 6,
                    border: '1px solid #F1F5F9',
                    background: isInpro ? '#EBF3FB' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isInpro) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC' } }}
                  onMouseLeave={e => { if (!isInpro) { e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.background = 'transparent' } }}
                  >
                    {/* 상태 점 */}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? '#22C55E' : isInpro ? '#2E75B6' : '#CBD5E1',
                    }} />
                    {/* 태스크명 */}
                    <span style={{
                      flex: 1, fontSize: 13,
                      color: isDone ? '#94A3B8' : isInpro ? '#1E4A8C' : '#334155',
                      fontWeight: isInpro ? 600 : 400,
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {task.title}{isInpro ? ` (${task.progress}%)` : ''}
                    </span>
                    {/* 우측 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {task.member && <Avatar initials={task.member.initials} color={task.member.color} size={18} fontSize={8} />}
                      <SpChip points={task.points} />
                    </div>
                  </div>
                )
              })}
            </div>
          </DashCard>

          <DashCard title="✨ AI 인사이트">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10,
                  padding: '10px 12px', borderRadius: 6,
                  border: `1px solid ${ins.border}`,
                  background: ins.bg,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 2 }}>{ins.title}</div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>{ins.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        </div>

      </div>
    </div>
  )
}
