import { Navigate, Outlet } from 'react-router-dom'

import { hasPermission, type AppPermission } from '@/features/auth/lib/permissions'
import { useAuthStore } from '@/features/auth/store/auth.store'

interface RoleProtectedRouteProps {
  permission: AppPermission
}

export function RoleProtectedRoute({ permission }: RoleProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (!hasPermission(user?.role, permission)) {
    return <Navigate replace to="/productos" />
  }

  return <Outlet />
}
