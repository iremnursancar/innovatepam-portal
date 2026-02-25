'use strict'
/**
 * evaluations.routes.test.js
 * Integration tests for /api/evaluations and admin evaluation workflow.
 */
const os = require('os')
const path = require('path')
const fs = require('fs')
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-eval-routes-'))
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
  db.exec('DELETE FROM evaluations')
  db.exec('DELETE FROM attachments')
  db.exec('DELETE FROM ideas')
  db.exec('DELETE FROM users')
}

async function loginAsSubmitter(email = 'evsub@test.com') {
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({ email, password: 'password123' })
  return agent
}

async function loginAsAdmin(email = 'evadmin@test.com') {
  const bcrypt = require('bcryptjs')
  const db = getDb()
  const hash = await bcrypt.hash('password123', 4)
  db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?,?,?)').run(email, hash, 'admin')
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ email, password: 'password123' })
  return agent
}

/** Creates and returns an idea submitted by a new submitter; returns { agent, ideaId } */
async function seedIdea(email = 'ideaowner@test.com') {
  const agent = await loginAsSubmitter(email)
  const { body } = await agent
    .post('/api/ideas')
    .field('title', 'Seed Idea')
    .field('description', 'For evaluation')
    .field('category', 'process_improvement')
  return { agent, ideaId: body.idea.id }
}

// ─── Suite setup / teardown ──────────────────────────────────────────────────

beforeAll(() => { runMigrations() })
beforeEach(() => { clearTables() })
afterAll(() => {
  closeDb()
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── POST /api/evaluations ────────────────────────────────────────────────────

describe('POST /api/evaluations', () => {
  test('201 – admin can accept an idea with a comment', async () => {
    const { ideaId } = await seedIdea()
    const admin = await loginAsAdmin()

    const res = await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'accepted',
      comment: 'Great idea!',
    })

    expect(res.status).toBe(201)
    expect(res.body.evaluation).toMatchObject({
      idea_id: ideaId,
      decision: 'accepted',
      comment: 'Great idea!',
    })
  })

  test('201 – admin can reject an idea with a comment', async () => {
    const { ideaId } = await seedIdea('seed2@test.com')
    const admin = await loginAsAdmin('admin2@test.com')

    const res = await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'rejected',
      comment: 'Not aligned with strategy.',
    })

    expect(res.status).toBe(201)
    expect(res.body.evaluation.decision).toBe('rejected')
  })

  test('201 – admin can update a prior evaluation (upsert)', async () => {
    const { ideaId } = await seedIdea('upsert@test.com')
    const admin = await loginAsAdmin('adminupsert@test.com')

    await admin.post('/api/evaluations').send({ ideaId, decision: 'accepted', comment: 'First' })
    const res = await admin.post('/api/evaluations').send({ ideaId, decision: 'rejected', comment: 'Changed mind' })

    expect(res.status).toBe(201)
    expect(res.body.evaluation.decision).toBe('rejected')
    expect(res.body.evaluation.comment).toBe('Changed mind')
  })

  test('400 – missing comment returns 400', async () => {
    const { ideaId } = await seedIdea('nocomment@test.com')
    const admin = await loginAsAdmin('adminnocomment@test.com')

    const res = await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'accepted',
    })

    expect(res.status).toBe(400)
  })

  test('400 – empty comment string returns 400', async () => {
    const { ideaId } = await seedIdea('emptycomment@test.com')
    const admin = await loginAsAdmin('adminempty@test.com')

    const res = await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'accepted',
      comment: '   ',
    })

    expect(res.status).toBe(400)
  })

  test('400 – invalid decision value returns 400', async () => {
    const { ideaId } = await seedIdea('baddec@test.com')
    const admin = await loginAsAdmin('adminbad@test.com')

    const res = await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'pending',
      comment: 'Decision is wrong',
    })

    expect(res.status).toBe(400)
    expect(res.body.error.toLowerCase()).toContain('decision')
  })

  test('404 – non-existent idea returns 404', async () => {
    const admin = await loginAsAdmin('admin404@test.com')

    const res = await admin.post('/api/evaluations').send({
      ideaId: 99999,
      decision: 'accepted',
      comment: 'Ghost idea',
    })

    expect(res.status).toBe(404)
  })

  test('403 – submitter (non-admin) cannot evaluate', async () => {
    const { ideaId, agent: sub } = await seedIdea('subevaluate@test.com')

    const res = await sub.post('/api/evaluations').send({
      ideaId,
      decision: 'accepted',
      comment: 'Not allowed',
    })

    expect(res.status).toBe(403)
  })

  test('401 – unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/evaluations').send({
      ideaId: 1,
      decision: 'accepted',
      comment: 'Anon',
    })

    expect(res.status).toBe(401)
  })
})

// ─── Evaluation effect on idea status ─────────────────────────────────────────

describe('Idea status after evaluation', () => {
  test('idea status becomes "accepted" after admin accepts it', async () => {
    const { ideaId } = await seedIdea('statusaccept@test.com')
    const admin = await loginAsAdmin('adminstatus@test.com')

    await admin.post('/api/evaluations').send({ ideaId, decision: 'accepted', comment: 'Yes' })

    // Verify via GET
    const adminGet = await admin.get(`/api/ideas/${ideaId}`)
    expect(adminGet.body.idea.status).toBe('accepted')
    expect(adminGet.body.idea.evaluation.decision).toBe('accepted')
  })

  test('idea status becomes "rejected" after admin rejects it', async () => {
    const { ideaId } = await seedIdea('statusreject@test.com')
    const admin = await loginAsAdmin('adminstatusrej@test.com')

    await admin.post('/api/evaluations').send({ ideaId, decision: 'rejected', comment: 'No' })

    const adminGet = await admin.get(`/api/ideas/${ideaId}`)
    expect(adminGet.body.idea.status).toBe('rejected')
  })
})
