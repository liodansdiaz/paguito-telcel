import { z } from 'zod';
import { isValidPhoneMX, cleanPhoneMX, validationMessages } from '../../shared/utils/validators';

/**
 * DTO para login
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

/**
 * DTO para refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;

/**
 * DTO para forgot password
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;

/**
 * DTO para reset password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe tener al menos una minúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
});

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;

/**
 * DTO para logout
 */
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LogoutDTO = z.infer<typeof logoutSchema>;