'use strict'
/**
 * ideas.routes.test.js
 * Integration tests for /api/ideas endpoints.
 * AAA pattern: Arrange → Act → Assert
 */
const os = require('os')
const path = require('path')
const fs = require('fs')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-ideas-routes-'))
process.env.DB_PATH = path.join(tmpDir, 'test.sqlite')
process.env.UPLOADS_PATH = path.join(tmpDir, 'uploads')
fs.mkdirSync(process.env.UPLOADS_PATH, { recursive: true })

const request = require('supertest')
const app = require('../app')
const { runMigrations } = require('../db/migrate')
const { getDb, closeDb } = require('../db/database')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearTables() {
  const db = getDb()
  db.exec('DELETE FROM notifications')
  db.exec('DELETE FROM idea_status_history')
  db.exec('DELETE FROM idea_votes')
  db.exec('DELETE FROM activities')
  db.exec('DELETE FROM evaluations')
  db.exec('DELETE FROM attachments')
  db.exec('DELETE FROM ideas')
  db.exec('DELETE FROM users')
}

/** Returns an agent authenticated as a new submitter */
async function loginAsSubmitter(email = 'sub@test.com') {
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({ email, password: 'password123' })
  return agent
}

/** Returns an agent authenticated as admin (pre-seeded directly in DB) */
async function loginAsAdmin(email = 'admin@test.com') {
  const bcrypt = require('bcryptjs')
  const db = getDb()
  const hash = await bcrypt.hash('password123', 4) // low rounds for speed
  db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?,?,?)').run(email, hash, 'admin')
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ email, password: 'password123' })
  return agent
}

// ─── Suite setup / teardown ──────────────────────────────────────────────────

beforeAll(() => { runMigrations() })
beforeEach(() => { clearTables() })
afterAll(() => {
  closeDb()
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── POST /api/ideas ──────────────────────────────────────────────────────────

describe('POST /api/ideas', () => {
  test('201 – creates idea with valid fields', async () => {
    const agent = await loginAsSubmitter()

    const res = await agent
      .post('/api/ideas')
      .field('title', 'Test Idea')
      .field('description', 'A great idea')
      .field('category', 'product_idea')

    expect(res.status).toBe(201)
    expect(res.body.idea).toMatchObject({
      title: 'Test Idea',
      description: 'A great idea',
      category: 'product_idea',
      status: 'submitted',
    })
    expect(res.body.idea.attachments).toEqual([])
  })

  test('201 – creates idea with file attachment', async () => {
    const agent = await loginAsSubmitter()
    const fakeFile = path.join(tmpDir, 'sample.pdf')
    fs.writeFileSync(fakeFile, '%PDF-1.4 fake content')

    const res = await agent
      .post('/api/ideas')
      .field('title', 'Idea with File')
      .field('description', 'Attached')
      .field('category', 'other')
      .attach('attachment', fakeFile, { contentType: 'application/pdf' })

    expect(res.status).toBe(201)
    expect(res.body.idea.attachments).toHaveLength(1)
    expect(res.body.idea.attachments[0].originalname).toBe('sample.pdf')
  })

  test('400 – missing title returns validation error', async () => {
    const agent = await loginAsSubmitter()
    const res = await agent
      .post('/api/ideas')
      .field('description', 'desc')
      .field('category', 'other')
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Title')
  })

  test('400 – missing description returns validation error', async () => {
    const agent = await loginAsSubmitter()
    const res = await agent
      .post('/api/ideas')
      .field('title', 'My Idea')
      .field('category', 'other')
    expect(res.status).toBe(400)
  })

  test('400 – invalid category returns validation error', async () => {
    const agent = await loginAsSubmitter()
    const res = await agent
      .post('/api/ideas')
      .field('title', 'Idea')
      .field('description', 'Desc')
      .field('category', 'totally_invalid')
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Category')
  })

  test('401 – unauthenticated request returns 401', async () => {
    const res = await request(app)
      .post('/api/ideas')
      .field('title', 'x')
      .field('description', 'y')
      .field('category', 'other')
    expect(res.status).toBe(401)
  })
})

// ─── GET /api/ideas ───────────────────────────────────────────────────────────

describe('GET /api/ideas', () => {
  test('200 – submitter sees only their own ideas', async () => {
    const sub1 = await loginAsSubmitter('sub1@test.com')
    const sub2 = await loginAsSubmitter('sub2@test.com')

    // sub1 creates 2 ideas
    await sub1.post('/api/ideas').field('title', 'Idea 1').field('description', 'd').field('category', 'other')
    await sub1.post('/api/ideas').field('title', 'Idea 2').field('description', 'd').field('category', 'other')
    // sub2 creates 1 idea
    await sub2.post('/api/ideas').field('title', 'Idea 3').field('description', 'd').field('category', 'other')

    const res = await sub1.get('/api/ideas')
    expect(res.status).toBe(200)
    expect(res.body.ideas).toHaveLength(2)
    expect(res.body.ideas.every(i => i.submitter_email === 'sub1@test.com')).toBe(true)
  })

  test('200 – admin sees all ideas', async () => {
    const sub = await loginAsSubmitter('subonly@test.com')
    await sub.post('/api/ideas').field('title', 'I1').field('description', 'd').field('category', 'other')
    await sub.post('/api/ideas').field('title', 'I2').field('description', 'd').field('category', 'other')

    const admin = await loginAsAdmin()
    const res = await admin.get('/api/ideas')
    expect(res.status).toBe(200)
    expect(res.body.ideas.length).toBeGreaterThanOrEqual(2)
  })

  test('401 – unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/ideas')
    expect(res.status).toBe(401)
  })
})

// ─── GET /api/ideas/:id ───────────────────────────────────────────────────────

describe('GET /api/ideas/:id', () => {
  test('200 – owner can view their own idea', async () => {
    const agent = await loginAsSubmitter()
    const { body } = await agent
      .post('/api/ideas')
      .field('title', 'My Idea')
      .field('description', 'Details')
      .field('category', 'cost_reduction')
    const id = body.idea.id

    const res = await agent.get(`/api/ideas/${id}`)
    expect(res.status).toBe(200)
    expect(res.body.idea.id).toBe(id)
    expect(res.body.idea.attachments).toEqual([])
    expect(res.body.idea.evaluation).toBeNull()
  })

  test('403 – submitter cannot view another user\'s idea', async () => {
    const sub1 = await loginAsSubmitter('own@test.com')
    const { body } = await sub1
      .post('/api/ideas')
      .field('title', 'Private')
      .field('description', 'd')
      .field('category', 'other')

    const sub2 = await loginAsSubmitter('other@test.com')
    const res = await sub2.get(`/api/ideas/${body.idea.id}`)
    expect(res.status).toBe(403)
  })

  test('404 – non-existent idea returns 404', async () => {
    const agent = await loginAsSubmitter()
    const res = await agent.get('/api/ideas/99999')
    expect(res.status).toBe(404)
  })
})

// ─── PATCH /api/ideas/:id/status ─────────────────────────────────────────────

describe('PATCH /api/ideas/:id/status', () => {
  test('200 – admin can set idea to under_review', async () => {
    const sub = await loginAsSubmitter('patchsub@test.com')
    const { body } = await sub
      .post('/api/ideas')
      .field('title', 'Review Me')
      .field('description', 'd')
      .field('category', 'other')
    const id = body.idea.id

    const admin = await loginAsAdmin('patchadmin@test.com')
    const res = await admin.patch(`/api/ideas/${id}/status`)

    expect(res.status).toBe(200)
    expect(res.body.idea.status).toBe('under_review')
  })

  test('403 – submitter cannot change idea status', async () => {
    const sub = await loginAsSubmitter('forbidden@test.com')
    const { body } = await sub
      .post('/api/ideas')
      .field('title', 'No Access')
      .field('description', 'd')
      .field('category', 'other')

    const res = await sub.patch(`/api/ideas/${body.idea.id}/status`)
    expect(res.status).toBe(403)
  })
})
