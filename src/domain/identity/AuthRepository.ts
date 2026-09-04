import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type {
  AccountType,
  OtpChallenge,
  Session,
  SignUpResult,
} from './entities';
import type { Email, PhoneNumber } from './valueObjects';

export type SignInInput = Readonly<{ email: Email; password: string }>;
export type SignUpInput = Readonly<{
  accountType: AccountType;
  name: string;
  email: Email;
  phone: PhoneNumber;
  password: string;
}>;
/** What the profile screen submits, before validation. */
export type UpdateProfileInput = Readonly<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}>;

export interface AuthRepository {
  signIn(input: SignInInput): Promise<Result<Session, AppError>>;
  signUp(input: SignUpInput): Promise<Result<SignUpResult, AppError>>;
  signOut(): Promise<Result<void, AppError>>;
  restoreSession(): Promise<Result<Session | null, AppError>>;
  refreshSession(): Promise<Result<Session, AppError>>;
  sendPhoneOtp(phone: PhoneNumber): Promise<Result<OtpChallenge, AppError>>;
  verifyPhoneOtp(
    challengeId: string,
    code: string,
  ): Promise<Result<void, AppError>>;
  updateProfile(input: UpdateProfileInput): Promise<Result<Session, AppError>>;
}
