import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Users from './pages/Users'
import Login from './pages/Login'
import Categories from './pages/Categories'
import Fornecedores from './pages/Fornecedores'
import Movimentacoes from './pages/Movimentacoes'
import Profile from './pages/Profile'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'

function App() {
  return (
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
            path="/fornecedores"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'GESTAO']}>
                <Fornecedores />
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

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App