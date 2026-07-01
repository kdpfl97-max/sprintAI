import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeamStore, ROLE_OPTIONS, COLOR_OPTIONS } from '../store/useTeamStore'
import { useAuthStore } from '../store/useAuthStore'

const inp = {
  width: '100%', padding: '11px 14px', border: '1px solid #E8EAED',
  borderRadius: 12, fontSize: 14, color: '#111827', outline: 'none',
  background: '#F9FAFB', boxSizing: 'border-box',
}
const btn = (active) => ({
  width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
  background: active ? '#2563EB' : '#E5E7EB', color: active ? '#fff' : '#9CA3AF',
  fontSize: 14, fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed',
})

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { settings, joinWithCode } = useTeamStore()
  const { login } = useAuthStore()

  // step: 'choose' | 'join-code' | 'join-profile'
  const [step, setStep] = useState('choose')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('프론트엔드')
  const [color, setColor] = useState('#2563EB')

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>🚀</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>SprintAI</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>소규모 팀 AI 스프린트 플래너</p>
        </div>

        {/* STEP 1: 선택 */}
        {step === 'choose' && (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16, textAlign: 'center' }}>어떻게 시작할까요?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => navigate('/backlog')} style={{
                padding: '16px 20px', borderRadius: 14, border: '2px solid #E8EAED',
                background: '#fff', textAlign: 'left', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3 }}>🏗️ 새 팀 만들기</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>PM으로 시작해 팀을 구성해요</p>
              </button>
              <button onClick={() => setStep('join-code')} style={{
                padding: '16px 20px', borderRadius: 14, border: '2px solid #E8EAED',
                background: '#fff', textAlign: 'left', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2563EB'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E8EAED'}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3 }}>🤝 팀 참여하기</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>PM에게 받은 팀 코드로 합류해요</p>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: 팀 코드 입력 */}
        {step === 'join-code' && (
          <>
            <button onClick={() => { setStep('choose'); setCodeError('') }}
              style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13, cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← 돌아가기
            </button>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>팀 코드 입력</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>PM에게 받은 코드를 입력해주세요 (예: SPR-AB12)</p>
            <input
              style={{ ...inp, fontSize: 20, fontWeight: 700, letterSpacing: '0.08em', textAlign: 'center', textTransform: 'uppercase', marginBottom: 8 }}
              placeholder="SPR-XXXX"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
              onKeyDown={e => e.key === 'Enter' && code.length >= 6 && handleCodeSubmit()}
            />
            {codeError && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{codeError}</p>}
            <button onClick={handleCodeSubmit} disabled={code.length < 4} style={btn(code.length >= 4)}>
              확인 →
            </button>
          </>
        )}

        {/* STEP 3: 프로필 입력 */}
        {step === 'join-profile' && (
          <>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#D1FAE5', border: '1px solid #A7F3D0', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>✅</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>팀 코드 확인 완료!</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>내 프로필 설정</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 6 }}>이름 *</label>
                <input style={inp} placeholder="이름을 입력하세요" value={name} onChange={e => setName(e.target.value)}/>
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
                      width: 30, height: 30, borderRadius: '50%', border: `3px solid ${color === c ? '#111827' : 'transparent'}`,
                      background: c, cursor: 'pointer', transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.1s',
                    }}/>
                  ))}
                  {name && (
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginLeft: 4 }}>
                      {name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleJoin} disabled={!name.trim()} style={btn(!!name.trim())}>
              🚀 팀에 합류하기
            </button>
          </>
        )}
      </div>
    </div>
  )
}
