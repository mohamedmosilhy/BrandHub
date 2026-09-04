import { DomainError, type AppError } from '@core/errors';
import { err, type Result } from '@core/result';

import type {
  AuthRepository,
  SignInInput,
  SignUpInput,
  UpdateProfileInput,
} from './AuthRepository';
import type { OtpChallenge, Session, SignUpResult } from './entities';
import {
  createEmail,
  createPhoneNumber,
  type PhoneNumber,
} from './valueObjects';

export class SignInUseCase {
  constructor(private readonly repository: AuthRepository) {}
  execute(input: SignInInput): Promise<Result<Session, AppError>> {
    return this.repository.signIn(input);
  }
}

export class UpdateProfileUseCase {
  constructor(private readonly repository: AuthRepository) {}

  /**
   * The email is validated but not sent: `PUT /users/me` takes the name and phone only, so
   * changing an account's email is a separate flow the contract does not yet expose. Validating
   * it here keeps the screen's read-only field honest about what a valid address looks like.
   */
  async execute(input: UpdateProfileInput): Promise<Result<Session, AppError>> {
    if (!input.firstName.trim() || !input.lastName.trim())
      return err(
        new DomainError({
          code: 'NAME_REQUIRED',
          message: 'First and last name are required',
          correlationId: 'domain-identity',
        }),
      );
    const email = createEmail(input.email);
    if (!email.ok) return email;
    const phone = createPhoneNumber(input.phone);
    if (!phone.ok) return phone;
    return this.repository.updateProfile({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: email.value,
      phone: phone.value,
    });
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
