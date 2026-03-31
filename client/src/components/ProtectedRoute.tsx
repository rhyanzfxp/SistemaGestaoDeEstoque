import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<'ADMIN' | 'ESTOQUISTA' | 'FUNCIONARIO' | 'GESTAO'>
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.perfil)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
