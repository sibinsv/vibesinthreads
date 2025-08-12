module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/middleware/validation.test.ts'],
  verbose: true,
  testTimeout: 10000,
  detectOpenHandles: false,
  forceExit: true,
  setupFiles: ['<rootDir>/tests/jest-setup.ts'],
};