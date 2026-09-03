import type { AppError } from '@core/errors';
import type { Result } from '@core/result';

import type {
  AuthRepository,
  SignInInput,
  SignUpInput,
} from './AuthRepository';
import type { OtpChallenge, Session, SignUpResult } from './entities';
import type { PhoneNumber } from './valueObjects';

export class SignInUseCase {
  constructor(private readonly repository: AuthRepository) {}
  execute(input: SignInInput): Promise<Result<Session, AppError>> {
    return this.repository.signIn(input);
  }
}

export class SignUpUseCase {
  constructor(private readonly repository: AuthRepository) {}
  execute(input: SignUpInput): Promise<Result<SignUpResult, AppError>> {
    return this.repository.signUp(input);
  }
}

export class SignOutUseCase {
  constructor(private readonly repository: AuthRepository) {}
  execute(): Promise<Result<void, AppError>> {
    return this.repository.signOut();
  }
}

export class RestoreSessionUseCase {
  constructor(private readonly repository: AuthRepository) {}
  execute(): Promise<Result<Session | null, AppError>> {
    return this.repository.restoreSession();
  }
}

export class RefreshSessionUseCase {
  constructor(private readonly repository: AuthRepository) {}
  execute(): Promise<Result<Session, AppError>> {
    return this.repository.refreshSession();
  }
}

/** Mock-only until FA1 supplies a phone-auth session contract (D12). */
export class PhoneOtpUseCase {
  constructor(private readonly repository: AuthRepository) {}
  send(phone: PhoneNumber): Promise<Result<OtpChallenge, AppError>> {
    return this.repository.sendPhoneOtp(phone);
  }
  verify(challengeId: string, code: string): Promise<Result<void, AppError>> {
    return this.repository.verifyPhoneOtp(challengeId, code);
  }
}
