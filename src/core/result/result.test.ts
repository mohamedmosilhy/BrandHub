import { err, flatMap, isErr, isOk, map, ok, unwrapOr } from './result';

describe('Result', () => {
  it('maps and flat-maps successful values', () => {
    const mapped = map(ok(2), (value) => value * 3);
    const chained = flatMap(mapped, (value) => ok(String(value)));

    expect(chained).toEqual(ok('6'));
    expect(isOk(chained)).toBe(true);
  });

  it('preserves errors without invoking transforms', () => {
    const transform = jest.fn((value: number) => value * 2);
    const failed = err('nope');

    expect(map(failed, transform)).toBe(failed);
    expect(flatMap(failed, (value: number) => ok(value))).toBe(failed);
    expect(transform).not.toHaveBeenCalled();
    expect(isErr(failed)).toBe(true);
  });

  it('unwraps a value or the provided fallback', () => {
    expect(unwrapOr(ok(4), 9)).toBe(4);
    expect(unwrapOr(err('failed'), 9)).toBe(9);
  });
});
