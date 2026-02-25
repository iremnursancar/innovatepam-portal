'use strict'
/**
 * users.repository.test.js
 * Unit tests for the UserRepository data-access layer.
 * AAA pattern: Arrange → Act → Assert
 */
// ⚠️  Must be set BEFORE any app module is require()'d (config.js is fresh per test file).
const os = require('os')
const path = require('path')
const fs = require('fs')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-repo-'))
process.env.DB_PATH = path.join(tmpDir, 'test.sqlite')
const { runMigrations } = require('../db/migrate')
const { getDb, closeDb } = require('../db/database')
const { createUser, findByEmail, findById } = require('../repositories/userRepository')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearUsers() {
  getDb().exec('DELETE FROM users')
}

// ─── Suite setup / teardown ──────────────────────────────────────────────────

beforeAll(() => {
  runMigrations() // idempotent – skips already-applied migrations
})

beforeEach(() => {
  clearUsers()
})

afterAll(() => {
  closeDb()
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── createUser ───────────────────────────────────────────────────────────────

describe('createUser', () => {
  test('inserts a new user and returns a safe record (no password)', () => {
    // Arrange
    const data = { email: 'alice@example.com', password: 'hashed_pw', role: 'submitter' }

    // Act
    const user = createUser(data)

    // Assert
    expect(user).toMatchObject({
      id: expect.any(Number),
      email: 'alice@example.com',
      role: 'submitter',
      created_at: expect.any(String),
    })
    // findById intentionally omits the password column
    expect(user.password).toBeUndefined()
  })

  test('defaults role to "submitter" when role is not provided', () => {
    const user = createUser({ email: 'bob@example.com', password: 'hashed_pw' })
    expect(user.role).toBe('submitter')
  })

  test('accepts "admin" as a valid role', () => {
    const user = createUser({ email: 'admin@example.com', password: 'hashed_pw', role: 'admin' })
    expect(user.role).toBe('admin')
  })

  test('auto-increments id for each new user', () => {
    const u1 = createUser({ email: 'u1@example.com', password: 'pw' })
    const u2 = createUser({ email: 'u2@example.com', password: 'pw' })
    expect(u2.id).toBeGreaterThan(u1.id)
  })

  test('throws on duplicate email (unique constraint)', () => {
    createUser({ email: 'dup@example.com', password: 'pw' })
    expect(() => createUser({ email: 'dup@example.com', password: 'pw2' })).toThrow()
  })
})

// ─── findByEmail ─────────────────────────────────────────────────────────────

describe('findByEmail', () => {
  test('returns the full user row (including hashed password) for existing email', () => {
    // Arrange
    createUser({ email: 'carol@example.com', password: 'hashed_pw' })

    // Act
    const user = findByEmail('carol@example.com')

    // Assert
    expect(user).toMatchObject({
      id: expect.any(Number),
      email: 'carol@example.com',
      role: 'submitter',
    })
    // findByEmail returns the full row (password included for auth comparison)
    expect(user.password).toBe('hashed_pw')
  })

  test('returns undefined for an email that does not exist', () => {
    const result = findByEmail('ghost@example.com')
    expect(result).toBeUndefined()
  })

  test('is case-sensitive (stores what was inserted)', () => {
    createUser({ email: 'mixed@example.com', password: 'pw' })
    // The service lower-cases before storing; repository is just a data accessor
    expect(findByEmail('MIXED@example.com')).toBeUndefined()
    expect(findByEmail('mixed@example.com')).toBeDefined()
  })
})

// ─── findById ────────────────────────────────────────────────────────────────

describe('findById', () => {
  test('returns the user without password field', () => {
    // Arrange
    const created = createUser({ email: 'dave@example.com', password: 'hashed_pw' })

    // Act
    const user = findById(created.id)

    // Assert
    expect(user).toMatchObject({
      id: created.id,
      email: 'dave@example.com',
      role: 'submitter',
    })
    expect(user.password).toBeUndefined()
  })

  test('returns undefined for a non-existent id', () => {
    expect(findById(99999)).toBeUndefined()
  })
})
