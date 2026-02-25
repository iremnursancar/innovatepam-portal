'use strict'
/**
 * globalSetup.js — runs once before the entire Jest test run (separate VM).
 * Each test file creates its own temp-dir SQLite, so globalSetup has minimal
 * work to do — just ensure the data/ directory exists for production DBs.
 */
const path = require('path')
const fs = require('fs')

module.exports = async function globalSetup() {
  // Keep the production data/ directory around; test files use os.tmpdir().
  const dataDir = path.join(__dirname, '../../../data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}
