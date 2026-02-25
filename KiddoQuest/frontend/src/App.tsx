import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './app/RequireAuth'
import { AppLayout } from './app/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChildrenPage } from './pages/ChildrenPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { WeeklyScoresPage } from './pages/WeeklyScoresPage'
import { WeeklyScoreDetailPage } from './pages/WeeklyScoreDetailPage'
import { PointsPage } from './pages/PointsPage'
import { ShopPage } from './pages/ShopPage'
import { GamesPage } from './pages/GamesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { useAuth } from './auth/AuthContext'

function App() {
  const { isAuthed, role } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthed ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={role === 'CHILD' ? <Navigate to="/points" replace /> : <DashboardPage />} />
          <Route path="children" element={role === 'CHILD' ? <Navigate to="/points" replace /> : <ChildrenPage />} />
          <Route path="templates" element={role === 'CHILD' ? <Navigate to="/points" replace /> : <TemplatesPage />} />
          <Route path="weekly-scores" element={role === 'CHILD' ? <Navigate to="/points" replace /> : <WeeklyScoresPage />} />
          <Route
            path="weekly-scores/:id"
            element={role === 'CHILD' ? <Navigate to="/points" replace /> : <WeeklyScoreDetailPage />}
          />
          <Route path="points" element={<PointsPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="games" element={<GamesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
