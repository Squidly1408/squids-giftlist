import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from './ui/Spinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isAnonymous } = useAuth()

  if (loading) return <Spinner full />
  if (!user || isAnonymous) return <Navigate to="/login" replace />

  return <>{children}</>
}
