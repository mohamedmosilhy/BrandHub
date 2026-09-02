import { nativeReviewKeys, resources } from './resources';

describe('i18n resources', () => {
  it('has matching AR and EN keys in every namespace', () => {
    expect(Object.keys(resources.ar.common).sort()).toEqual(
      Object.keys(resources.en.common).sort(),
    );
    expect(Object.keys(resources.ar.states).sort()).toEqual(
      Object.keys(resources.en.states).sort(),
    );
    expect(Object.keys(resources.ar.common).length).toBeGreaterThan(250);
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
