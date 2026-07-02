import type { MovementType, UserRole } from '@/types/api.types'

export type AppPermission =
  | 'view:products'
  | 'manage:products'
  | 'view:inventory'
  | 'view:movements'
  | 'create:movement:any'
  | 'create:movement:out'
  | 'view:alerts'
  | 'view:replenishment'
  | 'manage:replenishment'
  | 'view:suppliers'
  | 'manage:suppliers'
  | 'view:users'
  | 'manage:users'
  | 'view:profile'

const rolePermissions: Record<UserRole, AppPermission[]> = {
  ADMIN: [
    'view:products',
    'manage:products',
    'view:inventory',
    'view:movements',
    'create:movement:any',
    'view:alerts',
    'view:replenishment',
    'manage:replenishment',
    'view:suppliers',
    'manage:suppliers',
    'view:users',
    'manage:users',
    'view:profile',
  ],
  MANAGER: [
    'view:products',
    'manage:products',
    'view:inventory',
    'view:movements',
    'create:movement:any',
    'view:alerts',
    'view:replenishment',
    'manage:replenishment',
    'view:suppliers',
    'manage:suppliers',
    'view:profile',
  ],
  OPERATOR: [
    'view:products',
    'view:inventory',
    'view:movements',
    'create:movement:out',
    'view:alerts',
    'view:profile',
  ],
}

export function hasPermission(role: UserRole | undefined, permission: AppPermission) {
  if (!role) {
    return false
  }

  return rolePermissions[role].includes(permission)
}

export function canManageProducts(role: UserRole | undefined) {
  return hasPermission(role, 'manage:products')
}

export function canManageSuppliers(role: UserRole | undefined) {
  return hasPermission(role, 'manage:suppliers')
}

export function canManageUsers(role: UserRole | undefined) {
  return hasPermission(role, 'manage:users')
}

export function canViewRoute(role: UserRole | undefined, permission: AppPermission) {
  return hasPermission(role, permission)
}

export function canCreateMovementType(role: UserRole | undefined, type: MovementType) {
  if (!role) {
    return false
  }

  if (hasPermission(role, 'create:movement:any')) {
    return true
  }

  return type === 'OUT' && hasPermission(role, 'create:movement:out')
}
