import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import authManager from './services/authManager'

const AuthContext = createContext({ session: null })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 AuthContext: Initializing with AuthManager...')
    
    // Subscribe to AuthManager state changes
    const unsubscribe = authManager.subscribe((user, session) => {
      console.log('📋 AuthContext: Auth state updated via AuthManager:', { user: user?.email, hasSession: !!session })
      setSession(session)
      setLoading(false)
    })
    
    // Setup the auth listener through AuthManager
    const authSubscription = authManager.setupAuthListener()
    
    // Initialize AuthManager
    authManager.initialize().then(() => {
      setLoading(false)
    }).catch((error) => {
      console.error('AuthManager initialization failed:', error)
      setLoading(false)
    })
    
    return () => { 
      console.log('🧹 AuthContext: Cleaning up listeners...')
      unsubscribe()
      authSubscription?.unsubscribe()
    }
  }, [])

  // wrap supabase.auth.signInWithPassword but refresh AuthManager after
  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.data?.session) {
      // Force refresh AuthManager to update cache
      await authManager.refresh()
    }
    return result
  }

  const signUp = async (email, password) => {
    const result = await supabase.auth.signUp({ email, password })
    if (result.data?.session) {
      await authManager.refresh()
    }
    return result
  }

  const signOut = async () => {
    const result = await supabase.auth.signOut()
    authManager.resetState()
    return result
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      // Expose AuthManager methods for advanced usage
      getCurrentUser: authManager.getCurrentUser.bind(authManager),
      isAuthenticated: authManager.isAuthenticated.bind(authManager),
      refreshAuth: authManager.refresh.bind(authManager),
      // Debugging helpers
      authManager: authManager // For direct access if needed
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
