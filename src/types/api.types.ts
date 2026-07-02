export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR'

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: UserRole
  active: boolean
  phone: string | null
  createdAt: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
}

export interface RefreshResponse {
  token: string
}

export interface MeResponse {
  user: AuthUser
}

export interface ApiErrorEnvelope {
  error: string
  message: string
  statusCode: number
  details?: unknown
}
