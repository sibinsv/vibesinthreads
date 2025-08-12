module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'jest\\..*\\.config\\.js',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        types: ['jest', 'node'],
        typeRoots: ['node_modules/@types', 'tests']
      }
    }
  },
  testTimeout: 20000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: false,
  forceExit: true,
  detectOpenHandles: false,
  maxWorkers: 1,
};