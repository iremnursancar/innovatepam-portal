'use strict'
/**
 * auth.routes.test.js
 * Integration tests for the /api/auth HTTP endpoints using Supertest.
 * AAA pattern: Arrange → Act → Assert
 *
 * Routes under test:
 *   POST   /api/auth/register
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *   GET    /api/auth/me
 */
// ⚠️  Must be set BEFORE any app module is require()'d (config.js is fresh per test file).
const os = require('os')
const path = require('path')
const fs = require('fs')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-routes-'))
process.env.DB_PATH = path.join(tmpDir, 'test.sqlite')
const request = require('supertest')
const app = require('../app')

const { runMigrations } = require('../db/migrate')
const { getDb, closeDb } = require('../db/database')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearUsers() {
  getDb().exec('DELETE FROM users')
}

/** Register a user and return the supertest agent that holds the cookie. */
async function registerAndGetAgent(email = 'user@example.com', password = 'password123') {
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({ email, password }).expect(201)
  return agent
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

// ─── POST /api/auth/register ─────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  test('201 – creates user and sets httpOnly auth cookie', async () => {
    // Arrange
    const body = { email: 'alice@example.com', password: 'password123' }

    // Act
    const res = await request(app).post('/api/auth/register').send(body)

    // Assert
    expect(res.status).toBe(201)
    expect(res.body.user).toMatchObject({
      id: expect.any(Number),
      email: 'alice@example.com',
      role: 'submitter',
    })
    // Password must never be returned
    expect(res.body.user.password).toBeUndefined()
    // Cookie must be present and httpOnly
    const cookieHeader = res.headers['set-cookie']
    expect(cookieHeader).toBeDefined()
    expect(cookieHeader.join('')).toContain('HttpOnly')
    expect(cookieHeader.join('')).toMatch(/token=/)
  })

  test('409 – duplicate email returns conflict error', async () => {
    // Arrange – first registration succeeds
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' })
      .expect(201)

    // Act – second with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' })

    // Assert
    expect(res.status).toBe(409)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toContain('already exists')
  })

  test('400 – missing email returns validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('400 – invalid email format returns validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('400 – password shorter than 8 characters returns validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@example.com', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.error).toContain('8 characters')
  })

  test('400 – missing password returns validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nopass@example.com' })

    expect(res.status).toBe(400)
  })
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  const CREDS = { email: 'login@example.com', password: 'password123' }

  beforeEach(async () => {
    // Seed a user before each test in this block
    await request(app).post('/api/auth/register').send(CREDS)
  })

  test('200 – valid credentials return user and set auth cookie', async () => {
    // Act
    const res = await request(app).post('/api/auth/login').send(CREDS)

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ email: CREDS.email, role: 'submitter' })
    expect(res.body.user.password).toBeUndefined()
    const cookieHeader = res.headers['set-cookie']
    expect(cookieHeader).toBeDefined()
    expect(cookieHeader.join('')).toMatch(/token=/)
    expect(cookieHeader.join('')).toContain('HttpOnly')
  })

  test('401 – wrong password returns unauthorised error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDS.email, password: 'wrong_password' })

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toContain('Invalid email or password')
  })

  test('401 – unknown email returns unauthorised error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: CREDS.password })

    expect(res.status).toBe(401)
    expect(res.body.error).toContain('Invalid email or password')
  })

  test('400 – missing email field returns bad request', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: CREDS.password })

    expect(res.status).toBe(400)
  })

  test('400 – missing password field returns bad request', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: CREDS.email })

    expect(res.status).toBe(400)
  })
})

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  test('200 – clears the auth cookie', async () => {
    // Arrange – get an authenticated agent
    const agent = await registerAndGetAgent()

    // Act
    const res = await agent.post('/api/auth/logout')

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Logged out')

    // The cookie should be cleared (expires in the past or maxAge=0)
    const setCookie = res.headers['set-cookie']
    expect(setCookie).toBeDefined()
    const cookieStr = setCookie.join('')
    // Cleared cookie: either contains "token=;" or "Expires=Thu, 01 Jan 1970"
    expect(cookieStr).toMatch(/token=;|Expires=Thu, 01 Jan 1970/)
  })

  test('200 – logout works even when not authenticated (idempotent)', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.status).toBe(200)
  })
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  test('200 – returns current user when authenticated via cookie', async () => {
    // Arrange – agent retains the Set-Cookie from registration
    const agent = await registerAndGetAgent('me@example.com')

    // Act
    const res = await agent.get('/api/auth/me')

    // Assert
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({
      email: 'me@example.com',
      role: 'submitter',
    })
    expect(res.body.user.password).toBeUndefined()
  })

  test('401 – returns unauthorised when no cookie is present', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  test('401 – returns unauthorised for a tampered / invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=this.is.not.a.valid.jwt')

    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error')
  })

  test('401 – returns unauthorised for a token signed with wrong secret', async () => {
    const jwt = require('jsonwebtoken')
    const fakeToken = jwt.sign({ id: 999, email: 'hacker@example.com', role: 'admin' }, 'wrong_secret')

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `token=${fakeToken}`)

    expect(res.status).toBe(401)
  })

  test('401 – after logout the session cookie no longer grants access', async () => {
    // Arrange
    const agent = await registerAndGetAgent('logout-me@example.com')

    // Log out
    await agent.post('/api/auth/logout').expect(200)

    // Act – try /me without a valid token
    const res = await agent.get('/api/auth/me')

    // Assert
    expect(res.status).toBe(401)
  })
})

// ─── GET /api/health (sanity check) ──────────────────────────────────────────

describe('GET /api/health', () => {
  test('200 – returns { status: "ok" }', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
