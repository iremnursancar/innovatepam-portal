'use strict'

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],

  // Set env vars before any app module is require()'d
  setupFiles: ['<rootDir>/src/__tests__/testEnv.js'],

  // Scaffold the test DB once before all suites; tear it down after
  globalSetup: '<rootDir>/src/__tests__/globalSetup.js',
  globalTeardown: '<rootDir>/src/__tests__/globalTeardown.js',

  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/__tests__/**',
    '!src/middleware/upload.js',     // Phase 4 – file uploads (not auth)
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 60, // WAL pragma & console.log paths only execute in production
    },
  },

  // Allow bcrypt to take time
  testTimeout: 30000,
}
