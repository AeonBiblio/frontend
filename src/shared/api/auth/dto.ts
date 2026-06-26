import type { TokenPair, UserOut, UserRole } from '@shared/api/core/schemas'
import type { LocalUserProfile } from '@shared/lib/db'

export type SessionUser = LocalUserProfile

export type LoginDto = {
  email: string
  password: string
}

export type RegisterDto = {
  email: string
  username: string
  password: string
  role?: UserRole
}

export type UpdateUserDto = {
  username?: string
  display_tag?: string
}

export type LoginResponse = TokenPair
export type RegisterResponse = UserOut
