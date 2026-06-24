import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useTeamStore } from '../../store/useTeamStore'
import { useSprintStore } from '../../store/useSprintStore'

// roles: 'PM' | 'member' | 'guest' (비로그인)
const NAV_ITEMS = [
  { to: '/capture',        label: '아이디어 캡처',    badge: null, roles: ['PM', 'member', 'guest'] },
  { to: '/backlog',        label: '백로그',           badge: null, roles: ['PM', 'member'] },
  { to: '/sprint/builder', label: 'AI 스프린트 빌더', badge: null, roles: ['PM'] },
  { to: '/sprint/1/board', label: '칸반 보드',        badge: null, roles: ['PM', 'member'] },
  { to: '/dashboard',      label: '대시보드',         badge: null, roles: ['PM', 'member'] },
  { to: '/retro',          label: '스프린트 회고',     badge: null, roles: ['PM', 'member'] },
  { to: '/team',           label: '팀 관리',          badge: null, roles: ['PM'] },
]

const C = {
  bg:          '#1D4ED8',
  bgDeep:      '#1E40AF',
  active:      'rgba(255,255,255,0.15)',
  hover:       'rgba(255,255,255,0.08)',
  divider:     'rgba(255,255,255,0.12)',
  textMain:    '#FFFFFF',
  textSub:     'rgba(255,255,255,0.65)',
  textMuted:   'rgba(255,255,255,0.4)',
  badgeBg:     'rgba(255,255,255,0.18)',
  badgeText:   '#FFFFFF',
  progressBg:  'rgba(255,255,255,0.2)',
  progressFill:'#FFFFFF',
}

function getUserRole(user) {
  if (!user) return 'guest'
  if (user.role === 'PM') return 'PM'
  return 'member'
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { currentUser, login, logout } = useAuthStore()
  const { members } = useTeamStore()
  const { sprint } = useSprintStore()
  const [showPicker, setShowPicker] = useState(false)

  const hasActiveSprint = sprint?.status === 'active'
  const sprintPct = (() => {
    if (!sprint?.tasks?.length) return 0
    const done = sprint.tasks.filter(t => t.status === 'done').length
    return Math.round((done / sprint.tasks.length) * 100)
  })()

  const userRole = getUserRole(currentUser)
  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(userRole))

  return (
    <aside style={{
      width: 240, minWidth: 240,
      height: '100%',
      display: 'flex', flexDirection: 'column',
      background: C.bg,
      position: 'relative',
    }}>

      {/* 로고 */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.textMain, fontSize: 15, fontWeight: 700,
          }}>S</div>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.textMain, letterSpacing: -0.3 }}>SprintAI</span>
        </div>
        <span style={{
          display: 'inline-block', marginTop: 8,
          fontSize: 11, fontWeight: 600,
          color: 'rgba(255,255,255,0.75)',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '2px 8px', borderRadius: 9999,
        }}>MVP Beta</span>
      </div>

      {/* 유저 선택 영역 (사이드바 상단) */}
      <div style={{
        padding: '12px 10px',
        borderBottom: `1px solid ${C.divider}`,
        position: 'relative',
      }}>
        <p style={{
          fontSize: 10, fontWeight: 600, color: C.textMuted,
          padding: '0 10px 6px', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>현재 사용자</p>

        <button onClick={() => setShowPicker(p => !p)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 10, border: 'none',
          background: showPicker ? C.active : 'rgba(255,255,255,0.06)',
          cursor: 'pointer', textAlign: 'left',
        }}
        onMouseEnter={e => { if (!showPicker) e.currentTarget.style.background = C.hover }}
        onMouseLeave={e => { if (!showPicker) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        >
          {currentUser ? (
            <>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: currentUser.color || 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white',
              }}>{currentUser.initials || currentUser.name?.slice(0,1)}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.textMain }}>{currentUser.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                  <p style={{ fontSize: 11, color: C.textMuted }}>{currentUser.role}</p>
                  {currentUser.role === 'PM' && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#FCD34D',
                      background: 'rgba(252,211,77,0.15)',
                      border: '1px solid rgba(252,211,77,0.3)',
                      padding: '0 5px', borderRadius: 9999,
                    }}>PM</span>
                  )}
                </div>
              </div>
              <span style={{ color: C.textMuted, fontSize: 11 }}>⇅</span>
            </>
          ) : (
            <>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: C.textMuted,
              }}>?</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>팀원 선택</p>
                <p style={{ fontSize: 11, color: C.textMuted }}>나는 누구인가요?</p>
              </div>
            </>
          )}
        </button>

        {/* 팀원 선택 드롭다운 */}
        {showPicker && (
          <div style={{
            position: 'absolute', top: '100%', left: 10, right: 10,
            background: '#FFFFFF', borderRadius: 14,
            border: '1px solid #E8EAED',
            boxShadow: '0 8px 24px rgba(17,24,39,0.14)',
            overflow: 'hidden', zIndex: 100,
            marginTop: 4,
          }}>
            <p style={{ padding: '10px 14px 8px', fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #F4F5F7' }}>
              팀원 선택
            </p>
            <div style={{ padding: '6px 6px' }}>
              {members.map(m => (
                <button key={m.id} onClick={() => { login(m); setShowPicker(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, border: 'none',
                    background: currentUser?.id === m.id ? '#EFF6FF' : 'transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (currentUser?.id !== m.id) e.currentTarget.style.background = '#F4F5F7' }}
                  onMouseLeave={e => { if (currentUser?.id !== m.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: m.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>{m.initials}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>{m.role}</p>
                  </div>
                  {m.role === 'PM' && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#2563EB',
                      background: '#EFF6FF', border: '1px solid #BFDBFE',
                      padding: '1px 6px', borderRadius: 9999, flexShrink: 0,
                    }}>PM</span>
                  )}
                  {currentUser?.id === m.id && (
                    <span style={{ color: '#2563EB', fontSize: 14 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
            {currentUser && (
              <div style={{ borderTop: '1px solid #F4F5F7', padding: '6px' }}>
                <button onClick={() => { logout(); setShowPicker(false) }}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 10,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#DC2626', textAlign: 'left',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >로그아웃</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        <p style={{
          fontSize: 10, fontWeight: 600, color: C.textMuted,
          padding: '4px 10px 8px', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>메뉴</p>

        {visibleNav.map(({ to, label, badge }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 12px', height: 44, borderRadius: 10,
            fontSize: 14,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? C.textMain : C.textSub,
            background: isActive ? C.active : 'transparent',
            textDecoration: 'none',
            transition: 'background 100ms, color 100ms',
          })}
          onMouseEnter={e => { if (!e.currentTarget.style.background.includes('0.15')) e.currentTarget.style.background = C.hover }}
          onMouseLeave={e => { if (!e.currentTarget.style.background.includes('0.15')) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ flex: 1 }}>{label}</span>
            {badge && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: C.badgeBg, color: C.badgeText,
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '1px 7px', borderRadius: 9999,
              }}>{badge}</span>
            )}
          </NavLink>
        ))}

        {/* 비로그인 안내 */}
        {userRole === 'guest' && (
          <div style={{
            margin: '12px 2px 0',
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${C.divider}`,
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 4 }}>
              더 많은 메뉴를 보려면
            </p>
            <p style={{ fontSize: 11, color: C.textMuted, lineHeight: '18px' }}>
              위에서 팀원을 선택하면<br />역할에 맞는 메뉴가 표시돼요
            </p>
          </div>
        )}
      </nav>

      {/* 현재 스프린트 카드 */}
      <div style={{ margin: '0 10px 10px', padding: 14, borderRadius: 12, background: C.bgDeep, border: `1px solid ${C.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>현재 스프린트</p>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color:       hasActiveSprint ? '#6EE7B7' : C.textMuted,
            background:  hasActiveSprint ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.08)',
            padding: '1px 7px', borderRadius: 9999,
          }}>{hasActiveSprint ? '진행 중' : sprint?.status === 'completed' ? '완료' : '대기'}</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.textMain, marginBottom: 10 }}>
          {sprint?.name || '스프린트 없음'}
        </p>
        {hasActiveSprint ? (
          <>
            <div style={{ height: 4, background: C.progressBg, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${sprintPct}%`, background: C.progressFill, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted }}>
              <span>{sprint.endDate}</span>
              <span style={{ fontWeight: 600, color: C.textSub }}>{sprintPct}%</span>
            </div>
          </>
        ) : (
          <p style={{ fontSize: 11, color: C.textMuted }}>
            {sprint?.status === 'completed' ? '회고를 진행해보세요' : '빌더에서 스프린트를 시작하세요'}
          </p>
        )}
      </div>
    </aside>
  )
}
