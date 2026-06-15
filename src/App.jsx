import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Session from './lib/Session'
import LandingPage from './pages/LandingPage'
import AdministrativePage from './pages/AdministrativePage'
import CoursesPage from './pages/CoursesPage'
import UserPage from './pages/UserPage'
import CourseViewPage from './pages/CourseViewPage'

function RequireAuth({ children, roles }) {
  const user = Session.get()
  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.tipo)) {
    return <Navigate to={user.tipo === 'cliente' ? '/user' : '/admin'} replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth roles={['professor', 'educacional', 'empresarial']}>
              <AdministrativePage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <RequireAuth roles={['professor', 'educacional', 'empresarial']}>
              <CoursesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/user"
          element={
            <RequireAuth roles={['cliente']}>
              <UserPage />
            </RequireAuth>
          }
        />
        <Route
          path="/course/:courseId"
          element={
            <RequireAuth roles={['cliente']}>
              <CourseViewPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
