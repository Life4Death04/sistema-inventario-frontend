import { AlertTriangle, Boxes, ClipboardList, PackagePlus, ShieldCheck, Truck, UserCircle2, Users } from 'lucide-react'

export const navigation = [
  { to: '/productos', label: 'Catalogo', icon: Boxes, description: 'Gestione y visualice el inventario general.' },
  { to: '/inventario', label: 'Existencias', icon: ClipboardList, description: 'Monitoree stock, minimos y diferencias operativas.' },
  { to: '/movimientos', label: 'Movimientos', icon: PackagePlus, description: 'Registre entradas, salidas y ajustes del inventario.' },
  { to: '/alertas', label: 'Alertas', icon: AlertTriangle, description: 'Priorice incidencias y productos de riesgo.' },
  { to: '/reposicion', label: 'Reposicion', icon: Truck, description: 'Haga seguimiento a solicitudes y compras pendientes.' },
  { to: '/proveedores', label: 'Proveedores', icon: ShieldCheck, description: 'Centralice aliados comerciales y referencias de suministro.' },
  { to: '/usuarios', label: 'Usuarios', icon: Users, description: 'Administre roles, accesos y responsables del sistema.' },
] as const

export const profileNavigationItem = {
  to: '/perfil',
  label: 'Mi Perfil',
  icon: UserCircle2,
  description: 'Consulte sus datos y rol dentro del sistema.',
} as const

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
