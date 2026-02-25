'use strict'
/**
 * globalTeardown.js — runs once AFTER the entire Jest test run (separate VM).
 * Test files clean up their own temp dirs in afterAll, so this is a no-op.
 * Left in place for future use (e.g., cleaning shared fixtures).
 */
module.exports = async function globalTeardown() {
  // Each test file's afterAll cleans its own os.tmpdir() folder.
}
