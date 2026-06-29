import { z } from 'zod'

export const userRoleSchema = z.enum(['reader', 'author'])

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerBodySchema = loginBodySchema.extend({
  username: z.string().min(3).max(50),
  role: userRoleSchema.optional(),
})

export const updateUserBodySchema = z.object({
  username: z.string().min(3).max(50).optional(),
  display_tag: z.string().optional(),
})

export const userOutSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  display_tag: z.string().nullable(),
  avatar_key: z.string().nullable(),
  role: userRoleSchema,
  is_email_verified: z.boolean(),
  created_at: z.string(),
})

export const publicUserOutSchema = userOutSchema.omit({
  email: true,
  is_email_verified: true,
  created_at: true,
})

export type UserRole = z.infer<typeof userRoleSchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type RegisterBody = z.infer<typeof registerBodySchema>
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
export type UserOut = z.infer<typeof userOutSchema>
export type PublicUserOut = z.infer<typeof publicUserOutSchema>
