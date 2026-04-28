export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN'

export interface AuthUser {
  id: number | string
  firstName?: string
  lastName?: string
  username?: string
  avatarUrl?: string
  isAdmin?: boolean
  isVerified?: boolean
}

export interface AuthPayload {
  token: string
  user: AuthUser
  role: UserRole
}
