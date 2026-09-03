import { isAppError } from '@core/errors';
import { err, ok } from '@core/result';

import {
  InvalidCredentialsError,
  type AuthRepository,
  type SignInInput,
  type SignUpInput,
} from '@domain/identity';

import {
  AuthRemoteDataSource,
  SessionLocalDataSource,
} from '@data/identity/datasources';
import { mapSession } from '@data/identity/mappers';

import { normalizeHttpError } from '@infrastructure/http';

export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly remote: AuthRemoteDataSource,
    private readonly local: SessionLocalDataSource,
  ) {}

  async signIn(input: SignInInput): ReturnType<AuthRepository['signIn']> {
    try {
      const session = mapSession(
        await this.remote.signIn(input.email, input.password),
      );
      await this.local.save(session);
      return ok(session);
    } catch (source) {
      const error = isAppError(source) ? source : normalizeHttpError(source);
      return err(
        error.code === 'INVALID_CREDENTIALS'
          ? new InvalidCredentialsError(error.correlationId)
          : error,
      );
    }
  }

  async signUp(input: SignUpInput): ReturnType<AuthRepository['signUp']> {
    try {
      if (input.accountType === 'seller') {
        await this.remote.registerSeller({
          name: input.name,
          email: input.email,
          phoneNumber: input.phone,
          password: input.password,
        });
        return ok({ kind: 'sellerPendingApproval', email: input.email });
      }
      const [firstName, ...lastNames] = input.name.trim().split(/\s+/);
      await this.remote.registerCustomer({
        firstName: firstName ?? '',
        lastName: lastNames.join(' '),
        email: input.email,
        phone: input.phone,
        password: input.password,
      });
      const signedIn = await this.signIn(input);
      return signedIn.ok
        ? ok({ kind: 'authenticated', session: signedIn.value })
        : signedIn;
    } catch (source) {
      return err(isAppError(source) ? source : normalizeHttpError(source));
    }
  }

  async signOut(): ReturnType<AuthRepository['signOut']> {
    const current = await this.local.load();
    try {
      if (current) await this.remote.signOut(current.refreshToken);
      return ok(undefined);
    } catch (source) {
      return err(isAppError(source) ? source : normalizeHttpError(source));
    } finally {
      await this.local.clear();
    }
  }

  async restoreSession(): ReturnType<AuthRepository['restoreSession']> {
    try {
      return ok(await this.local.load());
    } catch (source) {
      await this.local.clear();
      return err(isAppError(source) ? source : normalizeHttpError(source));
    }
  }

  async refreshSession(): ReturnType<AuthRepository['refreshSession']> {
    try {
      const current = await this.local.load();
      if (!current)
        return err(
          normalizeHttpError(new Error('No session is available to refresh')),
        );
      const tokens = await this.remote.refresh(current.refreshToken);
      const session = {
        ...current,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? current.refreshToken,
      };
      await this.local.save(session);
      return ok(session);
    } catch (source) {
      await this.local.clear();
      return err(isAppError(source) ? source : normalizeHttpError(source));
    }
  }

  async sendPhoneOtp(
    phone: SignUpInput['phone'],
  ): ReturnType<AuthRepository['sendPhoneOtp']> {
    try {
      return ok(await this.remote.sendPhoneOtp(phone));
    } catch (source) {
      return err(isAppError(source) ? source : normalizeHttpError(source));
    }
  }

  async verifyPhoneOtp(
    challengeId: string,
    code: string,
  ): ReturnType<AuthRepository['verifyPhoneOtp']> {
    try {
      await this.remote.verifyPhoneOtp(challengeId, code);
      return ok(undefined);
    } catch (source) {
      return err(isAppError(source) ? source : normalizeHttpError(source));
    }
  }
}
