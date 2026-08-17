import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { ensureUserProfile } from '../lib/firestore'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAnonymous: boolean
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  ensureGuestSession: () => Promise<User>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  async function signUpWithEmail(name: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await ensureUserProfile(cred.user.uid, { displayName: name, email, photoURL: cred.user.photoURL })
  }

  async function signInWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signInWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider)
    await ensureUserProfile(cred.user.uid, {
      displayName: cred.user.displayName ?? 'Gift List user',
      email: cred.user.email ?? '',
      photoURL: cred.user.photoURL,
    })
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  /** Signs the visitor in anonymously so they can claim gifts without creating an account. */
  async function ensureGuestSession(): Promise<User> {
    if (auth.currentUser) return auth.currentUser
    const cred = await signInAnonymously(auth)
    return cred.user
  }

  const value: AuthContextValue = {
    user,
    loading,
    isAnonymous: !!user?.isAnonymous,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    resetPassword,
    signOut,
    ensureGuestSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
