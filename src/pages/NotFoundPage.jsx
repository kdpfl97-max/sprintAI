import { useNavigate } from 'react-router-dom'
export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center">
      <p className="text-6xl mb-4">🤔</p>
      <h1 className="text-xl font-bold text-slate-700 mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-slate-400 text-sm mb-6">URL을 다시 확인해주세요</p>
      <button onClick={() => navigate('/backlog')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2E75B6]">
        홈으로
      </button>
    </div>
  )
}
