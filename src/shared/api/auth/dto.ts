export type SessionUser = {
  id: string
  email: string
  username: string
  isEmailVerified: boolean
  isBlocked: boolean
  createdAt: string
  updatedAt: string
  cachedAt: string
}

export type LoginDto = {
  email: string
  password: string
}

export type RegisterDto = {
  email: string
  username: string
  password: string
}
