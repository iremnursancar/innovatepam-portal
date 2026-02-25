'use strict'
/**
 * auth.service.test.js
 * Unit tests for authService: register(), login(), bcrypt usage, JWT issuance.
 * AAA pattern: Arrange → Act → Assert
 */
// ⚠️  Must be set BEFORE any app module is require()'d (config.js is fresh per test file).
const os = require('os')
const path = require('path')
const fs = require('fs')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-service-'))
process.env.DB_PATH = path.join(tmpDir, 'test.sqlite')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { runMigrations } = require('../db/migrate')
const { getDb, closeDb } = require('../db/database')
const { register, login } = require('../services/authService')

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

// ─── register() ──────────────────────────────────────────────────────────────

describe('register()', () => {
  test('creates a user and returns { user, token }', async () => {
    // Arrange
    const email = 'alice@example.com'
    const password = 'secure123'

    // Act
    const result = await register(email, password)

    // Assert
    expect(result).toHaveProperty('user')
    expect(result).toHaveProperty('token')
    expect(result.user).toMatchObject({
      id: expect.any(Number),
      email: 'alice@example.com',
      role: 'submitter',
    })
    // Password must never be returned
    expect(result.user.password).toBeUndefined()
  })

  test('normalises email to lower-case before storing', async () => {
    const { user } = await register('ALICE@EXAMPLE.COM', 'secure123')
    expect(user.email).toBe('alice@example.com')
  })

  test('stores a bcrypt hash (not the plain-text password)', async () => {
    // Arrange
    const plainPassword = 'secret_password'

    // Act
    await register('hash@example.com', plainPassword)

    // Assert – verify the stored value is a valid bcrypt hash
    const { findByEmail } = require('../repositories/userRepository')
    const stored = findByEmail('hash@example.com')
    expect(stored.password).not.toBe(plainPassword)
    const isValid = await bcrypt.compare(plainPassword, stored.password)
    expect(isValid).toBe(true)
  })

  test('issues a signed JWT containing id, email and role', async () => {
    const { user, token } = await register('jwt@example.com', 'secure123')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    expect(decoded.id).toBe(user.id)
    expect(decoded.email).toBe(user.email)
    expect(decoded.role).toBe(user.role)
  })

  test('throws 409 for a duplicate email', async () => {
    // Arrange – first registration must succeed
    await register('dup@example.com', 'secure123')

    // Act & Assert
    await expect(register('dup@example.com', 'another_pw')).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('already exists'),
    })
  })

  test('throws 409 regardless of email casing for duplicate check', async () => {
    await register('case@example.com', 'secure123')
    await expect(register('CASE@EXAMPLE.COM', 'secure123')).rejects.toMatchObject({ status: 409 })
  })

  test('throws 400 when email is missing', async () => {
    await expect(register('', 'secure123')).rejects.toMatchObject({ status: 400 })
  })

  test('throws 400 when email format is invalid', async () => {
    await expect(register('not-an-email', 'secure123')).rejects.toMatchObject({ status: 400 })
    await expect(register('missing@', 'secure123')).rejects.toMatchObject({ status: 400 })
  })

  test('throws 400 when password is missing', async () => {
    await expect(register('valid@example.com', '')).rejects.toMatchObject({ status: 400 })
  })

  test('throws 400 when password is shorter than 8 characters', async () => {
    await expect(register('valid@example.com', 'short')).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('8 characters'),
    })
  })
})

// ─── login() ─────────────────────────────────────────────────────────────────

describe('login()', () => {
  const EMAIL = 'login@example.com'
  const PASSWORD = 'correct_password'

  beforeEach(async () => {
    // Seed a user before each login test
    await register(EMAIL, PASSWORD)
  })

  test('returns { user, token } for valid credentials', async () => {
    // Act
    const result = await login(EMAIL, PASSWORD)

    // Assert
    expect(result).toHaveProperty('user')
    expect(result).toHaveProperty('token')
    expect(result.user.email).toBe(EMAIL)
  })

  test('returned user does not contain the hashed password', async () => {
    const { user } = await login(EMAIL, PASSWORD)
    expect(user.password).toBeUndefined()
  })

  test('issued token contains the correct payload', async () => {
    const { user, token } = await login(EMAIL, PASSWORD)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    expect(decoded.id).toBe(user.id)
    expect(decoded.email).toBe(user.email)
    expect(decoded.role).toBe(user.role)
  })

  test('throws 400 when email is not provided', async () => {
    await expect(login('', PASSWORD)).rejects.toMatchObject({ status: 400 })
  })

  test('throws 400 when password is not provided', async () => {
    await expect(login(EMAIL, '')).rejects.toMatchObject({ status: 400 })
  })

  test('throws 401 for a non-existent email', async () => {
    await expect(login('ghost@example.com', PASSWORD)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('Invalid email or password'),
    })
  })

  test('throws 401 for an incorrect password', async () => {
    await expect(login(EMAIL, 'wrong_password')).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('Invalid email or password'),
    })
  })

  test('wrong-password error is indistinguishable from unknown-email error (timing-safe)', async () => {
    // Both must return the same message to prevent user enumeration
    let wrongEmailErr, wrongPasswordErr
    try { await login('unknown@example.com', PASSWORD) } catch (e) { wrongEmailErr = e }
    try { await login(EMAIL, 'wrongpass') } catch (e) { wrongPasswordErr = e }

    expect(wrongEmailErr.message).toBe(wrongPasswordErr.message)
  })

  test('login is case-insensitive for email', async () => {
    // register() lowercases; login() should also lowercase before lookup
    const result = await login(EMAIL.toUpperCase(), PASSWORD)
    expect(result.user.email).toBe(EMAIL)
  })
})

// ─── JWT utilities (signToken / verifyToken) ──────────────────────────────────

describe('JWT utilities', () => {
  const { signToken, verifyToken } = require('../utils/jwt')

  test('signToken produces a string with three dot-separated segments', () => {
    const token = signToken({ id: 1, email: 'a@b.com', role: 'submitter' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  test('verifyToken decodes a token signed with the same secret', () => {
    const payload = { id: 42, email: 'x@y.com', role: 'admin' }
    const token = signToken(payload)
    const decoded = verifyToken(token)
    expect(decoded.id).toBe(payload.id)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  test('verifyToken throws JsonWebTokenError for a tampered token', () => {
    const token = signToken({ id: 1, email: 'a@b.com', role: 'submitter' })
    const tampered = token.slice(0, -5) + 'xxxxx'
    expect(() => verifyToken(tampered)).toThrow()
  })

  test('verifyToken throws for a token signed with a different secret', () => {
    const foreignToken = jwt.sign({ id: 1 }, 'other_secret')
    expect(() => verifyToken(foreignToken)).toThrow()
  })
})
