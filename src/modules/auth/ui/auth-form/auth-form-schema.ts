import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Введите почту')
  .email('Введите корректный адрес почты')

export const passwordSchema = z
  .string()
  .min(1, 'Введите пароль')
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .max(128, 'Пароль не должен превышать 128 символов')
