import { apiClient } from '@/lib/axios'
import type { LoginFormValues } from '@/types/common.types'
import type { LoginResponse, MeResponse, RefreshResponse } from '@/types/api.types'

export async function loginRequest(values: LoginFormValues): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', values)

  return data
}

export async function refreshRequest(): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>('/auth/refresh')

  return data
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function meRequest(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/auth/me')

  return data
}
