import { create } from 'zustand'

import { loginRequest, logoutRequest, meRequest } from '@/features/auth/api/auth.api'
import {
  clearAccessToken,
  getAccessToken,
  registerSessionClearedHandler,
  setAccessToken,
} from '@/features/auth/lib/authSession'
import type { AuthUser } from '@/types/api.types'

interface AuthState {
  user: AuthUser | null
  token: string | null
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  bootstrapSession: () => Promise<void>
  setToken: (token: string | null) => void
  clearSession: () => void
}

let bootstrapPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getAccessToken(),
  isBootstrapping: true,
  login: async (email, password) => {
    const { user, token } = await loginRequest({ email, password })

    setAccessToken(token)
    set({ user, token })

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
          set({ user: null, token: null, isBootstrapping: false })
          return
        }

        set({ token, isBootstrapping: true })

        const { user } = await meRequest()
        set({ user, token: getAccessToken() })
      } catch {
        get().clearSession()
      } finally {
        set({ isBootstrapping: false })
        bootstrapPromise = null
      }
    })()

    return bootstrapPromise
  },
  setToken: (token) => {
    setAccessToken(token)
    set({ token, user: token ? get().user : null })
  },
  clearSession: () => {
    clearAccessToken()
    set({ user: null, token: null })
  },
}))

registerSessionClearedHandler(() => {
  useAuthStore.setState({ user: null, token: null, isBootstrapping: false })
})
