import { AlertTriangle, Boxes, ClipboardList, PackagePlus, ShieldCheck, Truck, UserCircle2, Users, type LucideIcon } from 'lucide-react'

import type { AppPermission } from '@/features/auth/lib/permissions'

export interface NavigationItem {
  to: string
  key: string
  icon: LucideIcon
  permission: AppPermission
}

export const navigation: NavigationItem[] = [
  { to: '/inventario', key: 'inventory', icon: ClipboardList, permission: 'view:inventory' },
  { to: '/movimientos', key: 'movements', icon: PackagePlus, permission: 'view:movements' },
  { to: '/productos', key: 'products', icon: Boxes, permission: 'view:products' },
  { to: '/alertas', key: 'alerts', icon: AlertTriangle, permission: 'view:alerts' },
  { to: '/reposicion', key: 'replenishment', icon: Truck, permission: 'view:replenishment' },
  { to: '/proveedores', key: 'suppliers', icon: ShieldCheck, permission: 'view:suppliers' },
  { to: '/usuarios', key: 'users', icon: Users, permission: 'view:users' },
]

export const profileNavigationItem = {
  to: '/perfil',
  key: 'profile',
  icon: UserCircle2,
  permission: 'view:profile' as const,
}

const routeMeta = [...navigation, profileNavigationItem]

export const getRouteMeta = (pathname: string) => {
  const activeItem = routeMeta.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))

  return activeItem?.key ?? null
}
