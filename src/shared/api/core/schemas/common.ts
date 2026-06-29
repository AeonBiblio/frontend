import { z } from 'zod'

export const decimalStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/)
