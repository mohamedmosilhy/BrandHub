import { Money } from './Money';

describe('Money', () => {
  it('adds decimal inputs without floating-point drift', () => {
    const total = Money.fromDecimal(0.1).plus(Money.fromDecimal(0.2));
    expect(total.baisa).toBe(300);
    expect(total.toDecimalString()).toBe('0.300');
  });

  it('calculates VAT exactly', () => {
    expect(Money.fromDecimal('64.200').percentage(5).toDecimalString()).toBe(
      '3.210',
    );
  });

  it.each([
    ['1.2344', '1.234'],
    ['1.2345', '1.235'],
    ['-1.2344', '-1.234'],
    ['-1.2345', '-1.235'],
    ['0.0005', '0.001'],
  ])('rounds %s half-up at the baisa to %s', (input, expected) => {
    expect(Money.fromDecimal(input).toDecimalString()).toBe(expected);
  });

  it('supports subtraction, multiplication, zero and comparison', () => {
    const positive = Money.fromDecimal('2.125').times(3);
    const negative = Money.zero().minus(Money.fromDecimal('1.250'));

    expect(positive.toDecimalString()).toBe('6.375');
    expect(negative.toDecimalString()).toBe('-1.250');
    expect(negative.compare(Money.zero())).toBe(-1);
    expect(Money.zero().compare(Money.zero())).toBe(0);
    expect(positive.compare(negative)).toBe(1);
  });

  it('rounds fractional multiplication half-up', () => {
    expect(Money.fromDecimal('1.001').times(1.5).toDecimalString()).toBe(
      '1.502',
    );
  });
});
