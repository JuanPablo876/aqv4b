import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({ session: null })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
// console.log('🔄 AuthContext: Getting initial session...')
    supabase.auth.getSession().then(({ data, error }) => {
// console.log('📋 AuthContext: Initial session result:', { session: data.session, error })
      setSession(data.session)
      setLoading(false)
    })
    
// console.log('👂 AuthContext: Setting up auth state listener...')
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
// console.log('🔔 AuthContext: Auth state changed:', { event, session })
      setSession(session)
    })
    
    return () => { 
// console.log('🧹 AuthContext: Cleaning up listener...')
      listener.subscription.unsubscribe() 
    }
  }, [])

  // wrap supabase.auth.signInWithPassword
  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password })

  const signOut = () =>
    supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
