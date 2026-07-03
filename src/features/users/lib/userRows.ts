import type { User, UserRole } from '@/types/api.types'

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Encargado de inventario',
  OPERATOR: 'Personal operativo',
}

export interface UserRow {
  id: string
  fullName: string
  email: string
  phone: string | null
  initials: string
  roleKey: UserRole
  role: string
  active: boolean
  createdAt: string
  updatedAt: string
  lastAccess: string | null
}

export function toUserRow(user: User): UserRow {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    initials: getInitials(user.fullName),
    roleKey: user.role,
    role: roleLabels[user.role],
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastAccess: null,
  }
}

function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('')
}
