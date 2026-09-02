/**
 * @jest-environment node
 *
 * Covers plan.md Phase 1 testing: "valid env parses; a missing required
 * variable fails with a named error".
 */
import { parseAppConfig } from './schema';

const valid = {
  env: 'development',
  apiBaseUrl: 'http://localhost:8081/api/v1',
  defaultLocale: 'ar',
  requestTimeoutMs: '15000',
  enableDevMenu: 'true',
};

describe('parseAppConfig', () => {
  it('parses a valid configuration', () => {
    const config = parseAppConfig(valid);

    expect(config.env).toBe('development');
    expect(config.apiBaseUrl).toBe('http://localhost:8081/api/v1');
    expect(config.defaultLocale).toBe('ar');
    expect(config.requestTimeoutMs).toBe(15000);
    expect(config.enableDevMenu).toBe(true);
  });

  it('coerces the timeout to a number and the dev-menu flag to a boolean', () => {
    const config = parseAppConfig({ ...valid, enableDevMenu: 'false' });

    expect(typeof config.requestTimeoutMs).toBe('number');
    expect(config.enableDevMenu).toBe(false);
  });

  it('freezes the result so configuration cannot drift at runtime', () => {
    const config = parseAppConfig(valid);

    expect(Object.isFrozen(config)).toBe(true);
  });

  it('names the missing field when a required value is absent', () => {
    const { apiBaseUrl: _omitted, ...withoutBaseUrl } = valid;

    expect(() => parseAppConfig(withoutBaseUrl)).toThrow(/apiBaseUrl/);
  });

  it('explains how to fix an invalid configuration', () => {
    expect(() => parseAppConfig({})).toThrow(/\.env\.example/);
  });

  it('rejects a base URL that is not absolute', () => {
    expect(() => parseAppConfig({ ...valid, apiBaseUrl: '/api/v1' })).toThrow(
      /apiBaseUrl/,
    );
  });

  it('rejects an unknown environment name', () => {
    expect(() => parseAppConfig({ ...valid, env: 'qa' })).toThrow(/env/);
  });

  it('rejects an unsupported locale', () => {
    expect(() => parseAppConfig({ ...valid, defaultLocale: 'fr' })).toThrow(
      /defaultLocale/,
    );
  });

  it('rejects a non-positive timeout', () => {
    expect(() => parseAppConfig({ ...valid, requestTimeoutMs: '0' })).toThrow(
      /requestTimeoutMs/,
    );
  });
});
