/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
    '<rootDir>/mock-server/**/*.test.ts',
  ],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1',
  },
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/data/**/mappers/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
  ],
  // Architecture.md §27.1: coverage is a target for the domain and the mappers
  // only. Chasing it elsewhere produces tests that assert implementation.
  //
  // Note for Phase 1: `collectCoverageFrom` currently matches no files, because
  // no domain or mapper code exists yet, so Jest treats these thresholds as
  // vacuous and `test:coverage` reports 0% without failing. They begin enforcing
  // the moment the first domain module lands in Phase 4.
  coverageThreshold: {
    global: {
      lines: 90,
      statements: 90,
      branches: 80,
      functions: 90,
    },
  },
  clearMocks: true,
  restoreMocks: true,
};
