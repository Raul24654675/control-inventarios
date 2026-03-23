import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Equipos from './pages/Equipos'
import Historial from './pages/Historial'

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
        element={token ? <Navigate to="/equipos" replace /> : <Login />}
      />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/historial" element={<Historial />} />
      </Route>
      <Route path="*" element={<Navigate to={token ? '/equipos' : '/login'} replace />} />
    </Routes>
  )
}
