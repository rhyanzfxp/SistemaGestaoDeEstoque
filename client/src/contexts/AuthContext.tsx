import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface User {
  id: string
  email: string
  nome: string
  perfil: 'ADMIN' | 'ESTOQUISTA' | 'FUNCIONARIO' | 'GESTAO'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('token')
  })

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error('Credenciais inválidas')
    }

    const data = await response.json()
    
    setToken(data.token)
    setUser(data.user)
    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      isLoading: false
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
