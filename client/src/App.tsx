import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Users from './pages/Users'
import Login from './pages/Login'
import Categories from './pages/Categories'
import Movimentacoes from './pages/Movimentacoes'
import Profile from './pages/Profile'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Alertas from './pages/Alertas'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/recuperar-senha" element={<RedefinirSenha />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/produtos"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'GESTAO']}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/categorias"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'GESTAO']}>
                  <Categories />
                </ProtectedRoute>
              }
            />

            <Route
              path="/movimentacoes"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'GESTAO']}>
                  <Movimentacoes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alertas"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'GESTAO']}>
                  <Alertas />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App