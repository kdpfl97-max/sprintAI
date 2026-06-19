import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useTeamStore } from '../../store/useTeamStore'

const NAV_ITEMS = [
  { to: '/capture',        label: '아이디어 캡처',    badge: null },
  { to: '/backlog',        label: '백로그',           badge: 18   },
  { to: '/sprint/builder', label: 'AI 스프린트 빌더', badge: null },
  { to: '/sprint/1/board', label: '칸반 보드',        badge: null },
  { to: '/dashboard',      label: '대시보드',         badge: null },
  { to: '/team',           label: '팀 관리',          badge: null },
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

export default function Sidebar() {
  const navigate = useNavigate()
  const { currentUser, login, logout } = useAuthStore()
  const { members } = useTeamStore()
  const [showPicker, setShowPicker] = useState(false)

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
          <span style={{ fontSize: 17, fontWeight: 700, color: C.textMain, letterSpacing: -0.3 }}>
            SprintAI
          </span>
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

      {/* 네비게이션 */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{
          fontSize: 10, fontWeight: 600,
          color: C.textMuted,
          padding: '4px 10px 8px',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>메뉴</p>

        {NAV_ITEMS.map(({ to, label, badge }) => (
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
      </nav>

      {/* 현재 스프린트 카드 */}
      <div style={{
        margin: '0 10px 10px',
        padding: 14, borderRadius: 12,
        background: C.bgDeep,
        border: `1px solid ${C.divider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            현재 스프린트
          </p>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: '#6EE7B7',
            background: 'rgba(110,231,183,0.15)',
            padding: '1px 7px', borderRadius: 9999,
          }}>진행 중</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.textMain, marginBottom: 10 }}>
          Sprint 1 — 핵심 AI
        </p>
        <div style={{ height: 4, background: C.progressBg, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: '42%', background: C.progressFill, borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted }}>
          <span>D-8</span>
          <span style={{ fontWeight: 600, color: C.textSub }}>42%</span>
        </div>
      </div>

      {/* 유저 영역 */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: `1px solid ${C.divider}`,
        position: 'relative',
      }}>
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: currentUser.color || 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'white',
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
                    padding: '0px 5px', borderRadius: 9999,
                  }}>PM</span>
                )}
              </div>
            </div>
            <button onClick={() => setShowPicker(p => !p)} style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: showPicker ? C.active : 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.textMuted, fontSize: 13,
            }}
            onMouseEnter={e => e.currentTarget.style.background = C.hover}
            onMouseLeave={e => e.currentTarget.style.background = showPicker ? C.active : 'transparent'}
            >⇅</button>
          </div>
        ) : (
          <button onClick={() => setShowPicker(p => !p)} style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
            border: '1px dashed rgba(255,255,255,0.25)',
            background: showPicker ? C.active : 'transparent',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.hover}
          onMouseLeave={e => e.currentTarget.style.background = showPicker ? C.active : 'transparent'}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.textMuted, fontSize: 16,
            }}>?</div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.textSub }}>팀원 선택</p>
              <p style={{ fontSize: 11, color: C.textMuted }}>나는 누구인가요?</p>
            </div>
          </button>
        )}

        {/* 팀원 선택 드롭다운 */}
        {showPicker && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 10, right: 10,
            background: '#FFFFFF', borderRadius: 14,
            border: '1px solid #E8EAED',
            boxShadow: '0 8px 24px rgba(17,24,39,0.12)',
            overflow: 'hidden', zIndex: 100,
            marginBottom: 6,
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
              <div style={{ borderTop: '1px solid #F4F5F7', padding: '6px 6px 6px' }}>
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
    </aside>
  )
}
