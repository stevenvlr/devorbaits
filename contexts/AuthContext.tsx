'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { loginUser, registerUser, logoutUser, getCurrentUser, updateUserProfile, type User } from '@/lib/auth-supabase'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: Omit<User, 'id' | 'dateCreation'> & { password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // #region agent log
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/0b33c946-95d3-4a77-b860-13fb338bf549',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:32',message:'AuthProvider useEffect start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
  }, []);
  // #endregion

  // Charger l'utilisateur depuis Supabase au démarrage
  useEffect(() => {
    let isMounted = true
    
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (isMounted && currentUser) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error)
        // Ne pas mettre à jour l'état si le composant est démonté
        if (isMounted) {
          setUser(null)
        }
      }
    }
    
    loadUser()
    
    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginUser(email, password)
      if (result.success && result.user) {
        setUser(result.user)
        return { success: true }
      }
      return { success: false, error: result.error || 'Erreur de connexion' }
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error)
      return { success: false, error: error.message || 'Erreur lors de la connexion' }
    }
  }

  const register = async (userData: Omit<User, 'id' | 'dateCreation'> & { password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await registerUser(userData)
      if (result.success && result.user) {
        setUser(result.user)
        return { success: true }
      }
      return { success: false, error: result.error || 'Erreur lors de l\'inscription' }
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error)
      return { success: false, error: error.message || 'Erreur lors de l\'inscription' }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await logoutUser()
      setUser(null)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      setUser(null)
    }
  }

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) return

    try {
      const result = await updateUserProfile(user.id, userData)
      if (result.success && result.user) {
        setUser(result.user)
      } else {
        console.error('Erreur lors de la mise à jour du profil:', result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
      logout, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

