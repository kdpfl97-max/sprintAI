import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeamStore, ROLE_OPTIONS, COLOR_OPTIONS } from '../store/useTeamStore'
import { useAuthStore } from '../store/useAuthStore'

const inp = {
  width: '100%', padding: '11px 14px', border: '1px solid #E8EAED',
  borderRadius: 12, fontSize: 14, color: '#111827', outline: 'none',
  background: '#F9FAFB', boxSizing: 'border-box',
}
const primaryBtn = (active) => ({
  width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
  background: active ? '#1D4ED8' : '#E5E7EB',
  color: active ? '#fff' : '#9CA3AF',
  fontSize: 14, fontWeight: 700,
  cursor: active ? 'pointer' : 'not-allowed',
})

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
      ← 돌아가기
    </button>
  )
}

function StepDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, background: i === current ? '#1D4ED8' : '#E5E7EB', transition: 'width 0.2s' }} />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { settings, joinWithCode, members } = useTeamStore()
  const { login } = useAuthStore()

  // steps: 'choose' | 'pm-profile' | 'pm-code' | 'join-code' | 'join-profile'
  const [step, setStep] = useState('choose')

  // PM 플로우 상태
  const [pmName, setPmName] = useState('')
  const [pmColor, setPmColor] = useState('#2563EB')

  // 팀원 플로우 상태
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('프론트엔드')
  const [color, setColor] = useState('#2563EB')

  function handlePmStart() {
    if (!pmName.trim()) return
    // 기존 PM 멤버 찾거나, 데모 멤버 중 PM으로 로그인
    const pm = members.find(m => m.role === 'PM') || {
      id: `m${Date.now()}`, name: pmName.trim(), role: 'PM',
      initials: pmName.trim().slice(0, 1), color: pmColor,
      capacity: 80, status: 'active', email: '',
    }
    login({ ...pm, name: pmName.trim(), initials: pmName.trim().slice(0, 1), color: pmColor })
    setStep('pm-code')
  }

  function handleCodeSubmit() {
    if (code.trim().toUpperCase() !== settings.teamCode) {
      setCodeError('팀 코드가 맞지 않아요. 다시 확인해주세요.')
      return
    }
    setCodeError('')
    setStep('join-profile')
  }

  function handleJoin() {
    if (!name.trim()) return
    const member = joinWithCode(settings.teamCode, name.trim(), role, color)
    if (!member) { setCodeError('팀 참여에 실패했어요.'); return }
    login(member)
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(150deg, #1D4ED8 0%, #1E40AF 60%, #1e3a8a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 10px' }}>🚀</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 2 }}>SprintAI</h1>
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>소규모 팀 AI 스프린트 플래너</p>
        </div>

        {/* ── STEP: choose ── */}
        {step === 'choose' && (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6, textAlign: 'center' }}>어떻게 시작할까요?</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 20 }}>역할을 선택하면 맞춤 환경으로 안내해드려요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setStep('pm-profile')} style={{
                padding: '18px 20px', borderRadius: 14, border: '2px solid #E8EAED',
                background: '#fff', textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>🏗️ PM으로 시작하기</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>팀을 만들고 스프린트를 관리해요</p>
              </button>
              <button onClick={() => setStep('join-code')} style={{
                padding: '18px 20px', borderRadius: 14, border: '2px solid #E8EAED',
                background: '#fff', textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>🤝 팀원으로 참여하기</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>PM에게 받은 팀 코드로 합류해요</p>
              </button>
            </div>
          </>
        )}

        {/* ── STEP: pm-profile ── */}
        {step === 'pm-profile' && (
          <>
            <BackBtn onClick={() => setStep('choose')} />
            <StepDots total={2} current={0} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>PM 프로필 설정</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>팀원들에게 표시될 내 이름과 아바타를 설정해요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 6 }}>이름 *</label>
                <input style={inp} placeholder="이름을 입력하세요" value={pmName} onChange={e => setPmName(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 8 }}>아바타 색상</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setPmColor(c)} style={{
                      width: 30, height: 30, borderRadius: '50%',
                      border: `3px solid ${pmColor === c ? '#111827' : 'transparent'}`,
                      background: c, cursor: 'pointer',
                      transform: pmColor === c ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.1s',
                    }} />
                  ))}
                  {pmName && (
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: pmColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginLeft: 4 }}>
                      {pmName.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handlePmStart} disabled={!pmName.trim()} style={primaryBtn(!!pmName.trim())}>
              다음 — 팀 코드 확인 →
            </button>
          </>
        )}

        {/* ── STEP: pm-code (팀 코드 공유) ── */}
        {step === 'pm-code' && (
          <>
            <StepDots total={2} current={1} />
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>팀 준비 완료!</p>
              <p style={{ fontSize: 12, color: '#9CA3AF' }}>아래 코드를 팀원에게 공유하면 합류할 수 있어요</p>
            </div>

            {/* 팀 코드 */}
            <div style={{ background: '#F0F7FF', border: '1.5px dashed #93C5FD', borderRadius: 14, padding: '20px 16px', textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#3B82F6', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em' }}>팀 코드</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#1D4ED8', letterSpacing: '0.12em', marginBottom: 12 }}>{settings.teamCode}</p>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(settings.teamCode)
                  // 복사 피드백은 버튼 텍스트로
                }}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.textContent = '✅ 복사됨!'; navigator.clipboard?.writeText(settings.teamCode) }}
                onMouseLeave={e => { e.currentTarget.textContent = '📋 코드 복사' }}
              >
                📋 코드 복사
              </button>
            </div>

            <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
                💡 팀원이 이 코드로 참여하면 대시보드에서 함께 스프린트를 관리할 수 있어요
              </p>
            </div>

            <button onClick={() => navigate('/team')} style={primaryBtn(true)}>
              🚀 팀 관리 페이지로 이동
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ ...primaryBtn(false), background: 'transparent', color: '#6B7280', marginTop: 8, cursor: 'pointer' }}>
              대시보드 먼저 보기
            </button>
          </>
        )}

        {/* ── STEP: join-code ── */}
        {step === 'join-code' && (
          <>
            <BackBtn onClick={() => { setStep('choose'); setCodeError('') }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>팀 코드 입력</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>PM에게 받은 코드를 입력해주세요</p>
            <input
              style={{ ...inp, fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center', textTransform: 'uppercase', marginBottom: 8 }}
              placeholder="SPR-XXXX"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
              onKeyDown={e => e.key === 'Enter' && code.length >= 4 && handleCodeSubmit()}
              autoFocus
            />
            {codeError && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{codeError}</p>}

            {/* 데모용 힌트 */}
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#92400E' }}>
                🔬 <strong>데모 힌트:</strong> 팀 코드는 PM 화면의 팀 관리 페이지에서 확인할 수 있어요.<br />
                현재 코드: <strong style={{ letterSpacing: '0.05em' }}>{settings.teamCode}</strong>
              </p>
            </div>

            <button onClick={handleCodeSubmit} disabled={code.length < 4} style={primaryBtn(code.length >= 4)}>
              확인 →
            </button>
          </>
        )}

        {/* ── STEP: join-profile ── */}
        {step === 'join-profile' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '9px 14px', marginBottom: 20 }}>
              <span>✅</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>팀 코드 확인 완료!</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>내 프로필 설정</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>팀원들에게 표시될 정보를 입력해요</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 6 }}>이름 *</label>
                <input style={inp} placeholder="이름을 입력하세요" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 6 }}>역할</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={role} onChange={e => setRole(e.target.value)}>
                  {ROLE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 8 }}>아바타 색상</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setColor(c)} style={{
                      width: 30, height: 30, borderRadius: '50%',
                      border: `3px solid ${color === c ? '#111827' : 'transparent'}`,
                      background: c, cursor: 'pointer',
                      transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.1s',
                    }} />
                  ))}
                  {name && (
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginLeft: 4 }}>
                      {name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleJoin} disabled={!name.trim()} style={primaryBtn(!!name.trim())}>
              🚀 팀에 합류하기
            </button>
          </>
        )}

      </div>
    </div>
  )
}
