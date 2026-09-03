import { Logger } from './Logger';

describe('Logger', () => {
  it('redacts every S5 secret field and bearer token', () => {
    const sink = jest.fn();
    const logger = new Logger(sink, true);

    logger.info('authorization=Bearer abc password=hunter2', {
      token: 'jwt-value',
      nested: {
        otp: '123456',
        cardNumber: '4111111111111111',
        iban: 'OM0000000000',
      },
    });

    const serialized = JSON.stringify(sink.mock.calls);
    for (const secret of [
      'abc',
      'hunter2',
      'jwt-value',
      '123456',
      '4111111111111111',
      'OM0000000000',
    ]) {
      expect(serialized).not.toContain(secret);
    }
    expect(serialized).toContain('[REDACTED]');
  });

  it('strips verbose debug logging in release mode', () => {
    const sink = jest.fn();
    const logger = new Logger(sink, false);
    logger.debug('debug-only');
    logger.info('kept');
    expect(sink).toHaveBeenCalledTimes(1);
  });
});
