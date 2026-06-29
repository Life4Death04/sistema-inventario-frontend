import { create } from 'zustand'

import { mockDb } from '@/data/mockDatabase'
import type { User } from '@/types/common.types'

interface AuthState {
  user: User | null
  login: (email: string, password: string) => Promise<User>
  logout: () => void
}

const STORAGE_KEY = 'inventory-demo-user'

const getStoredUser = () => {
  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return null
  }

  return JSON.parse(stored) as User
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window === 'undefined' ? null : getStoredUser(),
  login: async (email, password) => {
    const user = mockDb.users.find(
      (currentUser) => currentUser.email === email && currentUser.password === password && currentUser.active,
    )

    if (!user) {
      throw new Error('Credenciales invalidas')
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    set({ user })

    return user
  },
  logout: () => {
    window.localStorage.removeItem(STORAGE_KEY)
    set({ user: null })
  },
}))
