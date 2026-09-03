const BAISA_PER_RIAL = 1_000;

function decimalText(value: number | string): string {
  if (typeof value === 'string') return value.trim();
  if (!Number.isFinite(value)) throw new RangeError('Money must be finite.');
  if (!value.toString().includes('e')) return value.toString();
  return value.toFixed(12).replace(/\.?0+$/, '');
}

function parseScaled(value: number | string, scale: number): number {
  const text = decimalText(value);
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new TypeError(`Invalid decimal value: "${text}".`);

  const sign = match[1] === '-' ? -1 : 1;
  const whole = Number(match[2]);
  const fraction = match[3] ?? '';
  const kept = fraction.slice(0, scale).padEnd(scale, '0');
  const roundUp = Number(fraction[scale] ?? '0') >= 5;
  const scaled = whole * 10 ** scale + Number(kept) + (roundUp ? 1 : 0);
  if (!Number.isSafeInteger(scaled))
    throw new RangeError('Money exceeds the safe integer range.');
  return sign * scaled;
}

function roundRatioHalfUp(numerator: bigint, denominator: bigint): number {
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator < 0n ? -numerator : numerator;
  return Number(sign * ((absolute + denominator / 2n) / denominator));
}

export class Money {
  private constructor(readonly baisa: number) {
    if (!Number.isSafeInteger(baisa))
      throw new RangeError('Baisa must be a safe integer.');
    Object.freeze(this);
  }

  static fromBaisa(baisa: number): Money {
    return new Money(baisa);
  }

  static fromDecimal(rials: number | string): Money {
    return new Money(parseScaled(rials, 3));
  }

  static zero(): Money {
    return new Money(0);
  }

  toDecimal(): number {
    return this.baisa / BAISA_PER_RIAL;
  }

  toDecimalString(): string {
    const sign = this.baisa < 0 ? '-' : '';
    const absolute = Math.abs(this.baisa);
    return `${sign}${Math.floor(absolute / BAISA_PER_RIAL)}.${String(absolute % BAISA_PER_RIAL).padStart(3, '0')}`;
  }

  plus(other: Money): Money {
    return new Money(this.baisa + other.baisa);
  }

  minus(other: Money): Money {
    return new Money(this.baisa - other.baisa);
  }

  times(multiplier: number): Money {
    const scaledMultiplier = parseScaled(multiplier, 6);
    return new Money(
      roundRatioHalfUp(
        BigInt(this.baisa) * BigInt(scaledMultiplier),
        1_000_000n,
      ),
    );
  }

  percentage(percent: number): Money {
    const scaledPercent = parseScaled(percent, 6);
    return new Money(
      roundRatioHalfUp(
        BigInt(this.baisa) * BigInt(scaledPercent),
        100_000_000n,
      ),
    );
  }

  compare(other: Money): -1 | 0 | 1 {
    return this.baisa === other.baisa ? 0 : this.baisa < other.baisa ? -1 : 1;
  }
}
