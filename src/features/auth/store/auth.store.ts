import { isAxiosError } from 'axios'
import { create } from 'zustand'

import { loginRequest, logoutRequest, meRequest } from '@/features/auth/api/auth.api'
import {
  clearSessionState,
  getAccessToken,
  registerSessionClearedHandler,
  setAccessToken,
} from '@/features/auth/lib/authSession'
import type { AuthUser } from '@/types/api.types'

interface AuthState {
  user: AuthUser | null
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  bootstrapSession: () => Promise<void>
  clearSession: () => void
}

let bootstrapPromise: Promise<void> | null = null

function isAuthFailure(error: unknown) {
  if (!isAxiosError(error)) {
    return false
  }

  return error.response?.status === 401 || error.response?.status === 403
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isBootstrapping: true,
  login: async (email, password) => {
    const { user, token } = await loginRequest({ email, password })

    setAccessToken(token)
    set({ user })

    return user
  },
  logout: async () => {
    try {
      await logoutRequest()
    } finally {
      get().clearSession()
    }
  },
  bootstrapSession: async () => {
    if (bootstrapPromise) {
      return bootstrapPromise
    }

    bootstrapPromise = (async () => {
      try {
        const token = getAccessToken()

        if (!token) {
          set({ user: null, isBootstrapping: false })
          return
        }

        set({ isBootstrapping: true })

        const { user } = await meRequest()
        set({ user })
      } catch (error) {
        if (isAuthFailure(error)) {
          get().clearSession()
          return
        }

        set({ user: null })
      } finally {
        set({ isBootstrapping: false })
        bootstrapPromise = null
      }
    })()

    return bootstrapPromise
  },
  clearSession: () => {
    clearSessionState()
  },
}))

registerSessionClearedHandler(() => {
  useAuthStore.setState({ user: null, isBootstrapping: false })
})
