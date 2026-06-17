import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/banking'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurer la session depuis localStorage au démarrage
  useEffect(() => {
    const token = localStorage.getItem('banking_token')
    const savedUser = localStorage.getItem('banking_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('banking_user')
      }
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const res = await authAPI.login({ email, password })
    const { token, utilisateur } = res.data.donnees
    localStorage.setItem('banking_token', token)
    localStorage.setItem('banking_user', JSON.stringify(utilisateur))
    setUser(utilisateur)
    return utilisateur
  }

  async function register(nom, prenom, email, password) {
    const res = await authAPI.register({ nom, prenom, email, password })
    return res.data
  }

  function logout() {
    localStorage.removeItem('banking_token')
    localStorage.removeItem('banking_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
