import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import BacklogPage       from './pages/BacklogPage'
import SprintBuilderPage from './pages/SprintBuilderPage'
import BoardPage         from './pages/BoardPage'
import DashboardPage     from './pages/DashboardPage'
import CapturePage       from './pages/CapturePage'
import TeamPage          from './pages/TeamPage'
import LoginPage         from './pages/LoginPage'
import OnboardingPage    from './pages/OnboardingPage'
import NotFoundPage      from './pages/NotFoundPage'

/**
 * SprintAI 라우트 구조
 *
 * /                        → /backlog 리다이렉트
 * /login                   → 소셜 로그인
 * /onboarding              → 팀 생성 온보딩
 *
 * [AppLayout — 사이드바 + 탑바]
 * /backlog                 → 백로그 입력 & 관리
 * /sprint/builder          → AI 스프린트 빌더
 * /sprint/:sprintId/board  → 칸반 보드
 * /dashboard               → 대시보드
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/backlog" replace />} />
        <Route path="/backlog"                 element={<BacklogPage />} />
        <Route path="/sprint/builder"          element={<SprintBuilderPage />} />
        <Route path="/sprint/:sprintId/board"  element={<BoardPage />} />
        <Route path="/dashboard"               element={<DashboardPage />} />
        <Route path="/capture"                 element={<CapturePage />} />
        <Route path="/team"                    element={<TeamPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
