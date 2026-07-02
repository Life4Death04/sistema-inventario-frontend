import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Loading } from '@/components/ui/Loading'
import { useAuthStore } from '@/features/auth/store/auth.store'

export function ProtectedRoute() {
  const user = useAuthStore((state) => state.user)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const location = useLocation()

  if (isBootstrapping) {
    return <Loading />
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}
