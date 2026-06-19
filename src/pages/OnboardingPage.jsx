import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
export default function OnboardingPage() {
  const navigate = useNavigate()
  const [teamName, setTeamName] = useState('')
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl p-10 shadow-lg w-96">
        <h1 className="text-lg font-bold text-slate-800 mb-1">팀을 만들어볼까요? 👋</h1>
        <p className="text-sm text-slate-400 mb-6">팀 이름은 나중에 바꿀 수 있어요</p>
        <input
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm mb-4
                     focus:outline-none focus:border-[#2E75B6]"
          placeholder="팀 이름 입력 (예: 핀테크 개발팀)"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
        />
        <button
          onClick={() => teamName && navigate('/backlog')}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: teamName ? '#2E75B6' : '#CBD5E1', cursor: teamName ? 'pointer' : 'not-allowed' }}
        >
          시작하기 →
        </button>
      </div>
    </div>
  )
}
