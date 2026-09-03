import { DomainError } from '@core/errors';
import { err, ok, type Result } from '@core/result';

export type Email = string & { readonly __brand: 'Email' };
export type PhoneNumber = string & { readonly __brand: 'PhoneNumber' };

function invalid(code: string, message: string): DomainError {
  return new DomainError({ code, message, correlationId: 'domain-validation' });
}

export function createEmail(value: string): Result<Email, DomainError> {
  const normalized = value.trim().toLocaleLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ? ok(normalized as Email)
    : err(invalid('INVALID_EMAIL', 'Enter a valid email address'));
}

export function createPhoneNumber(
  value: string,
): Result<PhoneNumber, DomainError> {
  const normalized = value.replace(/[\s()-]/g, '');
  return /^\+968\d{8}$/.test(normalized)
    ? ok(normalized as PhoneNumber)
    : err(invalid('INVALID_PHONE', 'Enter an Omani number after +968'));
}
