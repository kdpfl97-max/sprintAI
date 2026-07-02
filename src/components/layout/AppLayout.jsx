import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuthStore } from '../../store/useAuthStore'
import { useNotificationStore } from '../../store/useNotificationStore'
import { useState } from 'react'
import { useTeamStore } from '../../store/useTeamStore'

const MOBILE_NAV = [
  { to: '/capture',        icon: '💡', label: '캡처',   roles: ['PM', 'member', 'guest'] },
  { to: '/sprint/1/board', icon: '📋', label: '칸반',   roles: ['PM', 'member'] },
  { to: '/dashboard',      icon: '🏠', label: '홈',     roles: ['PM', 'member'] },
  { to: '/backlog',        icon: '📝', label: '할 일',  roles: ['PM', 'member'] },
]

function MobileProfileSheet({ onClose }) {
  const { currentUser, login, logout } = useAuthStore()
  const { members } = useTeamStore()
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 401,
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '16px 0 8px', boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
      }}>
        <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 16px' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', padding: '0 20px 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>팀원 선택</p>
        {members.map(m => (
          <button key={m.id} onClick={() => { login(m); onClose() }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 20px', border: 'none', background: currentUser?.id === m.id ? '#EFF6FF' : 'transparent',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{m.initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{m.name}</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>{m.role}</p>
            </div>
            {currentUser?.id === m.id && <span style={{ color: '#2563EB', fontSize: 16 }}>✓</span>}
          </button>
        ))}
        {currentUser && (
          <button onClick={() => { logout(); onClose() }} style={{
            width: '100%', padding: '14px 20px', border: 'none', background: 'transparent',
            fontSize: 14, fontWeight: 600, color: '#DC2626', textAlign: 'left', cursor: 'pointer',
            borderTop: '1px solid #F3F4F6', marginTop: 8,
          }}>로그아웃</button>
        )}
      </div>
    </>
  )
}

export default function AppLayout() {
  const isMobile = useIsMobile()
  const { currentUser } = useAuthStore()
  const { unread } = useNotificationStore()
  const [showProfile, setShowProfile] = useState(false)

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', background: '#F4F5F7', overflow: 'hidden' }}>
      {/* 페이지 콘텐츠 */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      {/* 하단 탭바 */}
      <nav style={{
        display: 'flex', alignItems: 'stretch',
        background: '#fff', borderTop: '1px solid #E8EAED',
        height: 60, flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {visibleNav.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, textDecoration: 'none', fontSize: 10, fontWeight: isActive ? 700 : 500,
            color: isActive ? '#2563EB' : '#9CA3AF',
          })}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* 프로필 탭 */}
        <button onClick={() => setShowProfile(p => !p)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2, border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: 10, fontWeight: 500, color: '#9CA3AF', position: 'relative',
        }}>
          {currentUser ? (
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: currentUser.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
              {currentUser.initials}
            </div>
          ) : (
            <span style={{ fontSize: 20 }}>👤</span>
          )}
          <span style={{ color: currentUser ? '#2563EB' : '#9CA3AF', fontWeight: currentUser ? 700 : 500 }}>
            {currentUser ? currentUser.name.slice(0, 3) : '나'}
          </span>
          {unread > 0 && (
            <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(14px)', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', border: '1.5px solid #fff' }} />
          )}
        </button>
      </nav>

      {showProfile && <MobileProfileSheet onClose={() => setShowProfile(false)} />}
    </div>
  )
}
