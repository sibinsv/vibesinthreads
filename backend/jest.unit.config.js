module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit-simple.test.ts'],
  verbose: true,
  testTimeout: 5000,
  detectOpenHandles: false,
  forceExit: true,
};