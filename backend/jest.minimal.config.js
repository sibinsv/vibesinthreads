module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/simple.test.ts'],
  verbose: true,
  testTimeout: 3000,
  detectOpenHandles: false,
  forceExit: true,
};