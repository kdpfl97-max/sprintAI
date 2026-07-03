import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuthStore } from '../../store/useAuthStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import { useState } from 'react'
import { useTeamStore } from '../../store/useTeamStore'

// 사이드바와 동일한 브랜드 컬러
const C = {
  bg:       '#1D4ED8',
  bgDeep:   '#1E40AF',
  active:   'rgba(255,255,255,0.18)',
  textMain: '#FFFFFF',
  textSub:  'rgba(255,255,255,0.6)',
  divider:  'rgba(255,255,255,0.14)',
}

const icons = {
  capture: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2.5 6-4 7.5V18H9v-1.5C7.5 15 5 12.5 5 9a7 7 0 0 1 7-7z"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
      <line x1="9.5" y1="18" x2="14.5" y2="18"/>
    </svg>
  ),
  board: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1"/>
      <rect x="10" y="3" width="5" height="12" rx="1"/>
      <rect x="17" y="3" width="4" height="8" rx="1"/>
    </svg>
  ),
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  backlog: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="6" x2="20" y2="6"/>
      <line x1="9" y1="12" x2="20" y2="12"/>
      <line x1="9" y1="18" x2="20" y2="18"/>
      <polyline points="4 6 5 7 7 5"/>
      <polyline points="4 12 5 13 7 11"/>
      <polyline points="4 18 5 19 7 17"/>
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
}

const MOBILE_NAV = [
  { to: '/capture',        icon: icons.capture, label: '작성',  roles: ['PM', 'member', 'guest'] },
  { to: '/sprint/1/board', icon: icons.board,   label: '현황',  roles: ['PM', 'member'] },
  { to: '/dashboard',      icon: icons.home,    label: '홈',    roles: ['PM', 'member'] },
  { to: '/backlog',        icon: icons.backlog, label: '할 일', roles: ['PM', 'member'] },
]

function MobileProfileSheet({ onClose, currentUser, login, logout }) {
  const { members } = useTeamStore()
  const { notifications, markAllRead, clear, unread } = useNotificationStore()
  const [tab, setTab] = useState('profile') // 'profile' | 'notif'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 401,
        background: C.bg,
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(17,24,39,0.35)',
        overflow: 'hidden',
      }}>
        {/* 핸들 */}
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 4, background: C.active, borderRadius: 2 }} />
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, margin: '10px 16px 0', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 3 }}>
          {[{ id: 'profile', label: '팀원 전환' }, { id: 'notif', label: `알림${unread > 0 ? ` (${unread})` : ''}` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: tab === t.id ? 'rgba(255,255,255,0.18)' : 'transparent',
              color: tab === t.id ? C.textMain : C.textSub,
            }}>{t.label}</button>
          ))}
        </div>

        {/* 팀원 전환 */}
        {tab === 'profile' && (
          <div style={{ padding: '10px 10px 0' }}>
            {members.map(m => (
              <button key={m.id} onClick={() => { login(m); onClose() }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', border: 'none', borderRadius: 10,
                background: currentUser?.id === m.id ? C.active : 'transparent',
                cursor: 'pointer', textAlign: 'left', marginBottom: 2,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0, border: currentUser?.id === m.id ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent' }}>
                  {m.initials}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textMain }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: C.textSub }}>{m.role}</p>
                </div>
                {currentUser?.id === m.id && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6EE7B7', background: 'rgba(110,231,183,0.15)', padding: '2px 8px', borderRadius: 9999 }}>현재</span>
                )}
              </button>
            ))}
            {currentUser && (
              <button onClick={() => { logout(); onClose() }} style={{
                width: '100%', padding: '12px 12px', border: 'none', borderRadius: 10,
                background: 'rgba(239,68,68,0.12)',
                fontSize: 13, fontWeight: 600, color: '#FCA5A5', textAlign: 'left', cursor: 'pointer',
                marginTop: 4,
              }}>로그아웃</button>
            )}
          </div>
        )}

        {/* 알림 */}
        {tab === 'notif' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '8px 20px 4px' }}>
              {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11, fontWeight: 600, color: '#93C5FD', background: 'none', border: 'none', cursor: 'pointer' }}>모두 읽음</button>}
              {notifications.length > 0 && <button onClick={clear} style={{ fontSize: 11, color: C.textSub, background: 'none', border: 'none', cursor: 'pointer' }}>지우기</button>}
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto', padding: '0 10px 4px' }}>
              {notifications.length === 0 ? (
                <p style={{ padding: '24px 0', fontSize: 13, color: C.textSub, textAlign: 'center' }}>알림이 없어요</p>
              ) : notifications.map(n => (
                <div key={n.id} style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                  background: n.read ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{n.icon || '📢'}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: n.read ? 400 : 700, color: C.textMain }}>{n.title}</p>
                      {n.body && <p style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{n.body}</p>}
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                        {new Date(n.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 'env(safe-area-inset-bottom)', minHeight: 8 }} />
      </div>
    </>
  )
}

const DRAWER_NAV = [
  { to: '/sprint/builder', icon: '⚡', label: '이번 계획 만들기', desc: 'AI로 태스크를 자동 배분', roles: ['PM'] },
  { to: '/team',           icon: '👥', label: '팀 관리',         desc: '팀원 초대 및 역할 설정', roles: ['PM'] },
  { to: '/retro',          icon: '📝', label: '이번 계획 회고',   desc: '이번 계획 돌아보기',     roles: ['PM', 'member'] },
]

function HamburgerDrawer({ onClose, currentUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const roleKey = currentUser?.role === 'PM' ? 'PM' : 'member'
  const nav = DRAWER_NAV.filter(item => item.roles.includes(roleKey))
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, zIndex: 501,
        background: C.bg, display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
      }}>
        {/* 헤더 */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚀</div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: C.textMain }}>SprintAI</p>
              <p style={{ fontSize: 11, color: C.textSub }}>전체 메뉴</p>
            </div>
          </div>
        </div>

        {/* 메뉴 */}
        <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textSub, padding: '4px 10px 8px', letterSpacing: '0.08em' }}>추가 기능</p>
          {nav.map(({ to, icon, label, desc }) => {
            const isActive = location.pathname === to
            return (
              <button key={to} onClick={() => { navigate(to); onClose() }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 4,
                background: isActive ? C.active : 'transparent',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textMain }}>{label}</p>
                  <p style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{desc}</p>
                </div>
                {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#fff', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>

        {/* 닫기 */}
        <button onClick={onClose} style={{ margin: '0 10px 20px', padding: '12px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: C.textSub, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          ← 닫기
        </button>
      </div>
    </>
  )
}

export default function AppLayout() {
  const isMobile = useIsMobile()
  const { currentUser, login, logout } = useAuthStore()
  const { unread } = useNotificationStore()
  const [showProfile, setShowProfile] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const location = useLocation()

  const userRole = !currentUser ? 'guest' : currentUser.role === 'PM' ? 'PM' : 'member'
  const visibleNav = MOBILE_NAV.filter(n => n.roles.includes(userRole))

  if (!isMobile) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden' }}>
      {/* 모바일 상단 헤더 */}
      <div style={{ height: 48, flexShrink: 0, background: C.bg, display: 'flex', alignItems: 'center', paddingInline: 12, gap: 8, borderBottom: `1px solid ${C.divider}` }}>
        {/* 좌측 여백 균형용 */}
        <div style={{ width: 36 }} />
        <p style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: C.textMain, letterSpacing: '-0.3px' }}>SprintAI</p>
        <button onClick={() => setShowDrawer(true)} style={{ width: 36, height: 36, border: 'none', background: 'rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ width: 16, height: 2, background: '#fff', borderRadius: 1 }} />
          <div style={{ width: 16, height: 2, background: '#fff', borderRadius: 1 }} />
          <div style={{ width: 16, height: 2, background: '#fff', borderRadius: 1 }} />
        </button>
      </div>

      {/* 페이지 콘텐츠 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      {/* 하단 탭바 — 사이드바와 동일한 브랜드 컬러 */}
      <nav style={{
        display: 'flex', alignItems: 'stretch',
        background: C.bg,
        height: 60, flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderTop: `1px solid ${C.divider}`,
      }}>
        {visibleNav.map(({ to, icon, label }) => {
          const isActive = location.pathname === to || (to === '/sprint/1/board' && location.pathname.includes('/board'))
          return (
            <NavLink key={to} to={to} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, textDecoration: 'none', fontSize: 10, fontWeight: isActive ? 700 : 500,
              color: isActive ? C.textMain : C.textSub,
              background: isActive ? C.active : 'transparent',
              borderRadius: isActive ? 0 : 0,
              position: 'relative',
            }}>
              {isActive && (
                <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 2, background: '#fff', borderRadius: '0 0 2px 2px' }} />
              )}
              {icon}
              {label}
            </NavLink>
          )
        })}

        {/* 프로필 탭 */}
        <button onClick={() => setShowProfile(p => !p)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3, border: 'none', cursor: 'pointer',
          fontSize: 10, fontWeight: 500,
          color: showProfile ? C.textMain : C.textSub,
          background: showProfile ? C.active : 'transparent',
          position: 'relative',
        }}>
          {showProfile && (
            <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: 2, background: '#fff', borderRadius: '0 0 2px 2px' }} />
          )}
          {currentUser ? (
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: currentUser.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)' }}>
              {currentUser.initials}
            </div>
          ) : (
            icons.profile
          )}
          <span>{currentUser ? currentUser.name.slice(0, 3) : '나'}</span>
          {unread > 0 && (
            <span style={{ position: 'absolute', top: 8, right: '50%', transform: 'translateX(14px)', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '1.5px solid ' + C.bg }} />
          )}
        </button>
      </nav>

      {showProfile && <MobileProfileSheet currentUser={currentUser} login={login} logout={logout} onClose={() => setShowProfile(false)} />}
      {showDrawer && <HamburgerDrawer currentUser={currentUser} onClose={() => setShowDrawer(false)} />}
    </div>
  )
}
