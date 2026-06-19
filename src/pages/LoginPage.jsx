import { useNavigate } from 'react-router-dom'
export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl p-10 shadow-lg w-80 text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
             style={{ background: '#1E4A8C' }}>⚡</div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">SprintAI</h1>
        <p className="text-sm text-slate-400 mb-8">소규모 팀의 스프린트를 AI로</p>
        <button onClick={() => navigate('/onboarding')}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-3"
                style={{ background: '#1E4A8C' }}>
          구글로 시작하기
        </button>
        <button onClick={() => navigate('/onboarding')}
                className="w-full py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
          카카오로 시작하기
        </button>
      </div>
    </div>
  )
}
