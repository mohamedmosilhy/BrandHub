import { nativeReviewKeys, resources } from './resources';

/**
 * Arabic has six plural categories to English's two, so `reviewCount_few` exists in `ar` and not
 * in `en` by design. Parity is therefore checked on the base key — the thing a screen actually
 * calls — with the `_other` form required in both languages so no plural family is half-written.
 */
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function baseKeys(namespace: Record<string, unknown>): string[] {
  return [
    ...new Set(
      Object.keys(namespace).map((key) => key.replace(PLURAL_SUFFIX, '')),
    ),
  ].sort();
}

function pluralFamilies(namespace: Record<string, unknown>): string[] {
  return [
    ...new Set(
      Object.keys(namespace)
        .filter((key) => PLURAL_SUFFIX.test(key))
        .map((key) => key.replace(PLURAL_SUFFIX, '')),
    ),
  ].sort();
}

describe('i18n resources', () => {
  it('has matching AR and EN keys in every namespace', () => {
    expect(baseKeys(resources.ar.common)).toEqual(
      baseKeys(resources.en.common),
    );
    expect(Object.keys(resources.ar.states).sort()).toEqual(
      Object.keys(resources.en.states).sort(),
    );
    expect(Object.keys(resources.ar.common).length).toBeGreaterThan(250);
  });

  it('gives every plural family an `_other` form in both languages', () => {
    const families = new Set([
      ...pluralFamilies(resources.ar.common),
      ...pluralFamilies(resources.en.common),
    ]);
    expect(families.size).toBeGreaterThan(0);
    for (const family of families) {
      expect(resources.ar.common).toHaveProperty(`${family}_other`);
      expect(resources.en.common).toHaveProperty(`${family}_other`);
    }
  });

  it('flags every drafted state string for native review', () => {
    expect(nativeReviewKeys).toHaveLength(
      Object.keys(resources.ar.states).length,
    );
    expect(nativeReviewKeys.every((key) => key.startsWith('states:'))).toBe(
      true,
    );
  });
});
