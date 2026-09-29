import type { TFunction } from 'i18next'

import type { User, UserRole } from '@/types/api.types'

export type UsersTFunction = TFunction<['users', 'common']>

export interface UserRow {
  id: string
  fullName: string
  email: string
  phone: string | null
  initials: string
  roleKey: UserRole
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
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastAccess: null,
  }
}

/**
 * Resolves the display label for a role. The role enum itself is the stable
 * domain value, so labels are produced at render time and never stored on the row.
 */
export function getRoleLabel(role: UserRole, t: UsersTFunction): string {
  switch (role) {
    case 'ADMIN':
      return t('users:roles.ADMIN')
    case 'MANAGER':
      return t('users:roles.MANAGER')
    case 'OPERATOR':
      return t('users:roles.OPERATOR')
  }
}

export function getRoleHelper(role: UserRole, t: UsersTFunction): string {
  switch (role) {
    case 'ADMIN':
      return t('users:roleHelpers.ADMIN')
    case 'MANAGER':
      return t('users:roleHelpers.MANAGER')
    case 'OPERATOR':
      return t('users:roleHelpers.OPERATOR')
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
