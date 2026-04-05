import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Equipos from './pages/Equipos'
import Historial from './pages/Historial'
import Usuarios from './pages/Usuarios'
import Profile from './pages/Profile'
import Resumen from './pages/Resumen'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/resumen" replace /> : <Login />}
      />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/resumen" element={<Resumen />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to={token ? '/resumen' : '/login'} replace />} />
    </Routes>
  )
}
