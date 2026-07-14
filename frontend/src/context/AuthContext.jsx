import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { api, setAuthTokenGetter } from '../lib/api.js'
import { assertFirebaseReady, firebaseAuth, googleProvider } from '../lib/firebase.js'
import { AuthContext } from './auth-context.js'

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const syncUser = useCallback(async (currentUser) => {
    if (!currentUser) {
      setUser(null)
      setLoading(false)
      return null
    }

    setLoading(true)
    try {
      const profile = await api.me()
      setUser(profile)
      setAuthError('')
      return profile
    } catch (error) {
      setUser(null)
      setAuthError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!firebaseAuth?.currentUser) return null
      return firebaseAuth.currentUser.getIdToken()
    })

    if (!firebaseAuth) {
      setLoading(false)
      setAuthError('Firebase client environment variables are missing.')
      return undefined
    }

    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setFirebaseUser(currentUser)
      syncUser(currentUser)
    })
  }, [syncUser])

  const loginWithGoogle = useCallback(async () => {
    assertFirebaseReady()
    setAuthError('')
    const result = await signInWithPopup(firebaseAuth, googleProvider)
    return syncUser(result.user)
  }, [syncUser])

  const loginWithEmail = useCallback(async (email, password) => {
    assertFirebaseReady()
    setAuthError('')
    const result = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return syncUser(result.user)
  }, [syncUser])

  const signupWithEmail = useCallback(async ({ name, email, password }) => {
    assertFirebaseReady()
    setAuthError('')
    const result = await createUserWithEmailAndPassword(firebaseAuth, email, password)

    if (name) {
      await updateProfile(result.user, { displayName: name })
    }

    return syncUser(result.user)
  }, [syncUser])

  const logout = useCallback(async () => {
    if (firebaseAuth) {
      await signOut(firebaseAuth)
    }
    setUser(null)
    setFirebaseUser(null)
  }, [])

  const refreshUser = useCallback(() => syncUser(firebaseAuth?.currentUser), [syncUser])

  const value = useMemo(() => ({
    firebaseUser,
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
    refreshUser,
    setUser,
  }), [authError, firebaseUser, loading, loginWithEmail, loginWithGoogle, logout, refreshUser, signupWithEmail, user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
