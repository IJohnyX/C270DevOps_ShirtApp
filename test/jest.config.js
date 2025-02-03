module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./test/setup.js'],
    testMatch: ['**/test/**/*.test.js'],
    collectCoverage: true,
    coverageDirectory: 'coverage'
  };
  