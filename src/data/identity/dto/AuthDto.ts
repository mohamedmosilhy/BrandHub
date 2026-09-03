import { z } from 'zod';

export const userDtoSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().default(''),
  lastName: z.string().default(''),
  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  role: z.string(),
  storeName: z.string().optional(),
  name: z.string().optional(),
  status: z.string().optional(),
});

export const sessionDtoSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: userDtoSchema,
});

export const refreshDtoSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
});

export const otpChallengeDtoSchema = z.object({
  challengeId: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});

export const otpVerifiedDtoSchema = z.object({
  verified: z.literal(true),
  phone: z.string(),
});

export type UserDto = z.infer<typeof userDtoSchema>;
export type SessionDto = z.infer<typeof sessionDtoSchema>;
export type RefreshDto = z.infer<typeof refreshDtoSchema>;
export type OtpChallengeDto = z.infer<typeof otpChallengeDtoSchema>;
