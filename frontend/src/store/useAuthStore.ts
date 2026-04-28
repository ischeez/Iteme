import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthPayload, AuthUser, UserRole } from '../types/auth'

interface AuthState {
  token: string | null
  user: AuthUser | null
  role: UserRole | null
  isAuthenticated: boolean
  setAuth: (payload: AuthPayload) => void
  updateUser: (user: AuthUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      isAuthenticated: false,
      setAuth: ({ token, user, role }) => {
        localStorage.setItem('token', token)
        localStorage.setItem('role', role)
        set({ token, user, role, isAuthenticated: Boolean(token) })
      },
      updateUser: (user) =>
        set((state) => ({
          user: user ? { ...(state.user ?? {}), ...user } : null,
        })),
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        set({ token: null, user: null, role: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        const persistedToken = state?.token ?? localStorage.getItem('token')
        const persistedRole = state?.role ?? (localStorage.getItem('role') as UserRole | null)
        if (persistedToken && state) {
          state.token = persistedToken
          state.isAuthenticated = true
          state.role = persistedRole
        }
      },
    },
  ),
)
