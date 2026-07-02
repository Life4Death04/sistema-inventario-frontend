import { apiClient } from '@/lib/axios'
import type { User, UserRole, PaginatedResponse } from '@/types/api.types'

export interface ListUsersParams {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
  active?: boolean
}

export interface CreateUserInput {
  fullName: string
  email: string
  password: string
  role?: UserRole
  phone?: string
}

export interface UpdateUserInput {
  fullName?: string
  email?: string
  password?: string
  role?: UserRole
  phone?: string
  active?: boolean
}

interface UserEnvelope {
  user: User
}

export async function listUsers(params?: ListUsersParams): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get<PaginatedResponse<User>>('/users', { params })

  return data
}

export async function getUser(id: string): Promise<User> {
  const { data } = await apiClient.get<UserEnvelope>(`/users/${id}`)

  return data.user
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<UserEnvelope>('/users', input)

  return data.user
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const { data } = await apiClient.patch<UserEnvelope>(`/users/${id}`, input)

  return data.user
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}
