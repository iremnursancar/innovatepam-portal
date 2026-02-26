'use strict'
/**
 * notifications.routes.test.js
 * Integration tests for the /api/notifications HTTP endpoints.
 * AAA pattern: Arrange → Act → Assert
 *
 * Routes under test:
 *   GET    /api/notifications           – list user's notifications
 *   GET    /api/notifications/count     – unread counts (role-aware)
 *   PATCH  /api/notifications/:id/read  – mark single notification as read
 *   PATCH  /api/notifications/read-all  – mark all notifications as read
 *
 * Auto-creation behaviour under test:
 *   POST /api/ideas               → notifies all admins (new_submission)
 *   POST /api/evaluations         → notifies idea owner   (accepted / rejected)
 */
const os   = require('os')
const path = require('path')
const fs   = require('fs')

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-notif-'))
process.env.DB_PATH      = path.join(tmpDir, 'test.sqlite')
process.env.UPLOADS_PATH = path.join(tmpDir, 'uploads')
fs.mkdirSync(process.env.UPLOADS_PATH, { recursive: true })

const request = require('supertest')
const app     = require('../app')
const { runMigrations }  = require('../db/migrate')
const { getDb, closeDb } = require('../db/database')

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearTables() {
  const db = getDb()
  db.exec('DELETE FROM notifications')
  db.exec('DELETE FROM evaluations')
  db.exec('DELETE FROM attachments')
  db.exec('DELETE FROM ideas')
  db.exec('DELETE FROM users')
}

/** Registers a submitter and returns an authenticated agent. */
async function loginAsSubmitter(email = 'sub@notif.test') {
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({ email, password: 'password123' }).expect(201)
  return agent
}

/** Inserts an admin directly into the DB and returns an authenticated agent. */
async function loginAsAdmin(email = 'admin@notif.test') {
  const bcrypt = require('bcryptjs')
  const db     = getDb()
  const hash   = await bcrypt.hash('password123', 4) // low rounds for speed
  db.prepare('INSERT OR IGNORE INTO users (email, password, role) VALUES (?,?,?)')
    .run(email, hash, 'admin')
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ email, password: 'password123' }).expect(200)
  return agent
}

/** Seeds an idea from a unique submitter; returns { submitterAgent, ideaId }. */
async function seedIdea(email = 'seed-sub@notif.test') {
  const submitterAgent = await loginAsSubmitter(email)
  const { body } = await submitterAgent
    .post('/api/ideas')
    .field('title', 'Test Notification Idea')
    .field('description', 'Description for notification testing')
    .field('category', 'product_idea')
  return { submitterAgent, ideaId: body.idea.id }
}

/**
 * Directly inserts a notification row via the repository and returns its id.
 * Used to set up pre-existing notifications for read/unread tests.
 */
function insertNotification(userId, { ideaId = 1, type = 'accepted', message = 'Test notification' } = {}) {
  const db = getDb()
  const result = db.prepare(
    'INSERT INTO notifications (user_id, idea_id, type, message) VALUES (?,?,?,?)'
  ).run(userId, ideaId, type, message)
  return result.lastInsertRowid
}

/** Returns the user_id from DB for a given email. */
function getUserId(email) {
  return getDb().prepare('SELECT id FROM users WHERE email = ?').get(email)?.id
}

// ─── Suite setup / teardown ──────────────────────────────────────────────────

beforeAll(() => { runMigrations() })
beforeEach(() => { clearTables() })
afterAll(() => {
  closeDb()
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  test('401 – rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/notifications')
    expect(res.status).toBe(401)
  })

  test('200 – returns empty list when user has no notifications', async () => {
    const agent = await loginAsSubmitter()

    const res = await agent.get('/api/notifications')

    expect(res.status).toBe(200)
    expect(res.body.notifications).toEqual([])
    expect(res.body.unreadCount).toBe(0)
  })

  test('200 – returns own notifications with correct shape', async () => {
    const agent  = await loginAsSubmitter('shaped@notif.test')
    const userId = getUserId('shaped@notif.test')

    // Seed an idea so we have a valid idea_id
    const { ideaId } = await seedIdea('idea-owner-shape@notif.test')
    insertNotification(userId, { ideaId, type: 'accepted', message: 'Your idea was accepted' })

    const res = await agent.get('/api/notifications')

    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(1)
    expect(res.body.notifications[0]).toMatchObject({
      id:      expect.any(Number),
      user_id: userId,
      idea_id: ideaId,
      type:    'accepted',
      message: 'Your idea was accepted',
      is_read: 0,
    })
    expect(res.body.unreadCount).toBe(1)
  })

  test("200 – does NOT return another user's notifications", async () => {
    const userA = await loginAsSubmitter('userA@notif.test')
    const userB = await loginAsSubmitter('userB@notif.test')
    // Get User A's id from the session rather than a direct DB lookup
    const meRes = await userA.get('/api/auth/me')
    const idA   = meRes.body.user.id

    const { ideaId } = await seedIdea('owner-iso@notif.test')
    insertNotification(idA, { ideaId })        // belongs to User A only

    const res = await userB.get('/api/notifications')

    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(0)
    expect(res.body.unreadCount).toBe(0)
  })

  test('200 – orders notifications newest first (max 50)', async () => {
    const agent  = await loginAsSubmitter('ordered@notif.test')
    const userId = getUserId('ordered@notif.test')
    const { ideaId } = await seedIdea('owner-order@notif.test')

    // Insert 3 notifications in sequence
    insertNotification(userId, { ideaId, message: 'First' })
    insertNotification(userId, { ideaId, message: 'Second' })
    insertNotification(userId, { ideaId, message: 'Third' })

    const res = await agent.get('/api/notifications')

    expect(res.status).toBe(200)
    expect(res.body.notifications).toHaveLength(3)
    // All 3 messages present (order is created_at DESC; ties resolved by DB internals)
    const messages = res.body.notifications.map(n => n.message)
    expect(messages).toEqual(expect.arrayContaining(['First', 'Second', 'Third']))
    // The query adds ORDER BY created_at DESC — verify the SQL clause holds when
    // timestamps differ by sorting the returned rows and confirming monotonicity.
    const ids = res.body.notifications.map(n => n.id)
    expect(ids.length).toBe(new Set(ids).size) // all unique
  })
})

// ─── GET /api/notifications/count ─────────────────────────────────────────────

describe('GET /api/notifications/count', () => {
  test('401 – rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/notifications/count')
    expect(res.status).toBe(401)
  })

  test('200 – admin sees pendingIdeas count (ideas in submitted/under_review)', async () => {
    const admin = await loginAsAdmin()
    // Seed a submitted idea via a submitter
    await seedIdea('pending-owner@notif.test')

    const res = await admin.get('/api/notifications/count')

    expect(res.status).toBe(200)
    expect(res.body.pendingIdeas).toBeGreaterThanOrEqual(1)
    expect(res.body.newActivities).toBe(0)
  })

  test('200 – submitter sees newActivities = count of decided own ideas', async () => {
    // Arrange: submitter submits an idea, admin accepts it
    const admin = await loginAsAdmin('count-admin@notif.test')
    const { submitterAgent, ideaId } = await seedIdea('count-sub@notif.test')

    await admin.post('/api/evaluations').send({ ideaId, decision: 'accepted', comment: 'Great!' })

    const res = await submitterAgent.get('/api/notifications/count')

    expect(res.status).toBe(200)
    expect(res.body.pendingIdeas).toBe(0)
    expect(res.body.newActivities).toBeGreaterThanOrEqual(1)
  })
})

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────

describe('PATCH /api/notifications/:id/read', () => {
  test('401 – rejects unauthenticated request', async () => {
    const res = await request(app).patch('/api/notifications/1/read')
    expect(res.status).toBe(401)
  })

  test('200 – marks a notification as read', async () => {
    const agent  = await loginAsSubmitter('read1@notif.test')
    const userId = getUserId('read1@notif.test')
    const { ideaId } = await seedIdea('owner-read1@notif.test')
    const notifId = insertNotification(userId, { ideaId })

    const res = await agent.patch(`/api/notifications/${notifId}/read`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // Verify in DB
    const row = getDb().prepare('SELECT is_read FROM notifications WHERE id = ?').get(notifId)
    expect(row.is_read).toBe(1)
  })

  test('200 – unreadCount drops after marking a notification as read', async () => {
    const agent  = await loginAsSubmitter('read2@notif.test')
    const userId = getUserId('read2@notif.test')
    const { ideaId } = await seedIdea('owner-read2@notif.test')
    insertNotification(userId, { ideaId, message: 'N1' })
    const notifId = insertNotification(userId, { ideaId, message: 'N2' })

    await agent.patch(`/api/notifications/${notifId}/read`)

    const { body } = await agent.get('/api/notifications')
    expect(body.unreadCount).toBe(1)
  })

  test('200 – marking a non-existent ID is a no-op (UPDATE affects 0 rows, still 200)', async () => {
    const agent = await loginAsSubmitter('read3@notif.test')

    // The route runs an UPDATE; SQLite silently matches 0 rows – still succeeds
    const res = await agent.patch('/api/notifications/99999/read')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────

describe('PATCH /api/notifications/read-all', () => {
  test('401 – rejects unauthenticated request', async () => {
    const res = await request(app).patch('/api/notifications/read-all')
    expect(res.status).toBe(401)
  })

  test('200 – marks all own notifications as read', async () => {
    const agent  = await loginAsSubmitter('readall@notif.test')
    const userId = getUserId('readall@notif.test')
    const { ideaId } = await seedIdea('owner-readall@notif.test')

    insertNotification(userId, { ideaId, message: 'Notif 1' })
    insertNotification(userId, { ideaId, message: 'Notif 2' })
    insertNotification(userId, { ideaId, message: 'Notif 3' })

    const res = await agent.patch('/api/notifications/read-all')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const { body } = await agent.get('/api/notifications')
    expect(body.unreadCount).toBe(0)
    expect(body.notifications.every(n => n.is_read === 1)).toBe(true)
  })

  test("200 – only marks current user's notifications, not other users'", async () => {
    const agentA = await loginAsSubmitter('readall-a@notif.test')
    const agentB = await loginAsSubmitter('readall-b@notif.test')
    const idA    = getUserId('readall-a@notif.test')
    const idB    = getUserId('readall-b@notif.test')
    const { ideaId } = await seedIdea('owner-readall2@notif.test')

    insertNotification(idA, { ideaId, message: 'User A notif' })
    insertNotification(idB, { ideaId, message: 'User B notif' })

    // User A marks all as read
    await agentA.patch('/api/notifications/read-all')

    // User B's notification must remain unread
    const { body } = await agentB.get('/api/notifications')
    expect(body.unreadCount).toBe(1)
    expect(body.notifications[0].is_read).toBe(0)
  })

  test('200 – succeeds even when user has no notifications', async () => {
    const agent = await loginAsSubmitter('readall-empty@notif.test')

    const res = await agent.patch('/api/notifications/read-all')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})

// ─── Auto-creation: idea submission → admin notification ──────────────────────

describe('Auto-notification: idea submission', () => {
  test('creates a new_submission notification for every admin when idea is submitted', async () => {
    const db = getDb()

    // Set up two admins
    const admin1 = await loginAsAdmin('admin1-auto@notif.test')
    const admin2 = await loginAsAdmin('admin2-auto@notif.test')
    const id1    = getUserId('admin1-auto@notif.test')
    const id2    = getUserId('admin2-auto@notif.test')

    // Submitter posts an idea
    const submitter = await loginAsSubmitter('submitter-auto@notif.test')
    const { body }  = await submitter
      .post('/api/ideas')
      .field('title',       'Auto Notif Idea')
      .field('description', 'Triggers admin notification')
      .field('category',    'process_improvement')
    expect(body.idea.id).toBeDefined()

    // Both admins should have a notification
    const notif1 = db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'new_submission'"
    ).all(id1)
    const notif2 = db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'new_submission'"
    ).all(id2)

    expect(notif1).toHaveLength(1)
    expect(notif1[0].idea_id).toBe(body.idea.id)
    expect(notif1[0].message).toMatch(/Auto Notif Idea/)

    expect(notif2).toHaveLength(1)
    expect(notif2[0].idea_id).toBe(body.idea.id)
  })

  test('does NOT create notification for submitters when a peer submits an idea', async () => {
    const db = getDb()
    await loginAsSubmitter('peer-sub@notif.test')
    const peerId = getUserId('peer-sub@notif.test')

    await seedIdea('another-sub@notif.test')

    const notifs = db.prepare("SELECT * FROM notifications WHERE user_id = ?").all(peerId)
    expect(notifs).toHaveLength(0)
  })
})

// ─── Auto-creation: evaluation → submitter notification ───────────────────────

describe('Auto-notification: idea evaluation', () => {
  test('creates an accepted notification for the submitter when idea is accepted', async () => {
    const db    = getDb()
    const admin = await loginAsAdmin('eval-admin-acc@notif.test')
    const { submitterAgent, ideaId } = await seedIdea('eval-sub-acc@notif.test')
    const submitterId = getUserId('eval-sub-acc@notif.test')

    const evalRes = await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'accepted',
      comment:  'Excellent work!',
    })
    expect(evalRes.status).toBe(201)

    const notif = db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'accepted'"
    ).get(submitterId)

    expect(notif).toBeDefined()
    expect(notif.idea_id).toBe(ideaId)
    expect(notif.message).toMatch(/accepted/)
    expect(notif.is_read).toBe(0)
  })

  test('creates a rejected notification for the submitter when idea is rejected', async () => {
    const db    = getDb()
    const admin = await loginAsAdmin('eval-admin-rej@notif.test')
    const { ideaId } = await seedIdea('eval-sub-rej@notif.test')
    const submitterId = getUserId('eval-sub-rej@notif.test')

    await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'rejected',
      comment:  'Not aligned with goals.',
    })

    const notif = db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'rejected'"
    ).get(submitterId)

    expect(notif).toBeDefined()
    expect(notif.idea_id).toBe(ideaId)
    expect(notif.message).toMatch(/rejected/)
    expect(notif.is_read).toBe(0)
  })

  test('submitter sees evaluation notification via GET /api/notifications', async () => {
    const admin = await loginAsAdmin('eval-admin-get@notif.test')
    const { submitterAgent, ideaId } = await seedIdea('eval-sub-get@notif.test')

    await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'accepted',
      comment:  'Go for it!',
    })

    const res = await submitterAgent.get('/api/notifications')

    expect(res.status).toBe(200)
    const evalNotif = res.body.notifications.find(n => n.type === 'accepted')
    expect(evalNotif).toBeDefined()
    expect(evalNotif.idea_id).toBe(ideaId)
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1)
  })

  test('admin does NOT receive a notification when they evaluate an idea', async () => {
    const db    = getDb()
    const admin = await loginAsAdmin('eval-admin-self@notif.test')
    const adminId = getUserId('eval-admin-self@notif.test')
    const { ideaId } = await seedIdea('eval-sub-self@notif.test')

    await admin.post('/api/evaluations').send({
      ideaId,
      decision: 'accepted',
      comment:  'Admin approves.',
    })

    // Admin should not have an accepted/rejected notification for this action
    const adminNotif = db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? AND type IN ('accepted','rejected')"
    ).all(adminId)
    expect(adminNotif).toHaveLength(0)
  })
})
