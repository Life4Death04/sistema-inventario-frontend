import { AlertTriangle, Boxes, ClipboardList, PackagePlus, ShieldCheck, Truck, UserCircle2, Users, type LucideIcon } from 'lucide-react'

import type { AppPermission } from '@/features/auth/lib/permissions'

export interface NavigationItem {
  to: string
  label: string
  icon: LucideIcon
  description: string
  permission: AppPermission
}

export const navigation: NavigationItem[] = [
  { to: '/inventario', label: 'Existencias', icon: ClipboardList, description: 'Monitoree stock, minimos y diferencias operativas.', permission: 'view:inventory' },
  { to: '/movimientos', label: 'Movimientos', icon: PackagePlus, description: 'Registre entradas, salidas y ajustes del inventario.', permission: 'view:movements' },
  { to: '/productos', label: 'Catalogo', icon: Boxes, description: 'Gestione y visualice el inventario general.', permission: 'view:products' },
  { to: '/alertas', label: 'Alertas', icon: AlertTriangle, description: 'Priorice incidencias y productos de riesgo.', permission: 'view:alerts' },
  { to: '/reposicion', label: 'Reposicion', icon: Truck, description: 'Haga seguimiento a solicitudes y compras pendientes.', permission: 'view:replenishment' },
  { to: '/proveedores', label: 'Proveedores', icon: ShieldCheck, description: 'Centralice aliados comerciales y referencias de suministro.', permission: 'view:suppliers' },
  { to: '/usuarios', label: 'Usuarios', icon: Users, description: 'Administre roles, accesos y responsables del sistema.', permission: 'view:users' },
]

export const profileNavigationItem = {
  to: '/perfil',
  label: 'Mi Perfil',
  icon: UserCircle2,
  description: 'Consulte sus datos y rol dentro del sistema.',
  permission: 'view:profile' as const,
}

const routeMeta = [...navigation, profileNavigationItem]

export const getRouteMeta = (pathname: string) => {
  const activeItem = routeMeta.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))

  return (
    activeItem ?? {
      label: 'Sistema',
      description: 'Gestion operativa del inventario farmaceutico.',
    }
  )
}
