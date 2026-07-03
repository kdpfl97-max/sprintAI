import { useNavigate } from 'react-router-dom'

const features = [
  { icon: '🤖', text: 'AI가 할 일을 이번 계획으로 자동 배분' },
  { icon: '📋', text: '진행 현황판으로 실시간 상황 공유' },
  { icon: '💡', text: '할일 작성 → 즉시 태스크 전환' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(150deg, #1D4ED8 0%, #1E40AF 60%, #1e3a8a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* 브랜드 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px', backdropFilter: 'blur(8px)' }}>🚀</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 8 }}>SprintAI</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
            소규모 팀의 스프린트를<br />AI가 계획하고 관리해드립니다
          </p>
        </div>

        {/* 핵심 기능 3줄 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 16px', backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* 로그인 카드 */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
          {/* 데모 안내 배지 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '9px 14px', marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>🔬</span>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 1 }}>포트폴리오 데모 버전</p>
              <p style={{ fontSize: 11, color: '#B45309' }}>실제 로그인 없이 모든 기능을 체험할 수 있습니다</p>
            </div>
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>시작하기</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => navigate('/onboarding')}
              style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>
              구글로 시작하기 (데모)
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              카카오로 시작하기 (데모)
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            데모 환경에서는 소셜 로그인 대신<br />팀 역할을 직접 선택해 체험합니다
          </p>
        </div>
      </div>
    </div>
  )
}
