import { DomainError } from '@core/errors';

export class InvalidCredentialsError extends DomainError {
  constructor(correlationId: string) {
    super({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect',
      correlationId,
    });
  }
}
