import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { useAppData } from '../../context/useAppData.js'

export default function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  const { cache, loading: dataLoading } = useAppData()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-text-secondary">
        Loading your workspace...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  if (!cache.bootstrapped && dataLoading[`bootstrap:${cache.userId}`]) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-base text-text-secondary">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-border-subtle border-t-accent-signal" />
        <p className="text-sm">Preparing your workspace...</p>
      </div>
    )
  }

  return <Outlet />
}
