'use strict'
/**
 * middleware.test.js
 * Tests for requireRole() and errorHandler() middleware.
 * Uses plain mock request/response objects (no Supertest needed).
 * AAA pattern: Arrange → Act → Assert
 */

// ────────────────────────────────────────────────────────────────────────────
// requireRole
// ────────────────────────────────────────────────────────────────────────────

const requireRole = require('../middleware/requireRole')

/** Minimal mock Express objects */
function mockRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('requireRole middleware', () => {
  test('calls next() when req.user has the required role', () => {
    // Arrange
    const middleware = requireRole('admin')
    const req = { user: { id: 1, email: 'a@b.com', role: 'admin' } }
    const res = mockRes()
    const next = jest.fn()

    // Act
    middleware(req, res, next)

    // Assert
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  test('returns 403 when req.user has a different role', () => {
    // Arrange
    const middleware = requireRole('admin')
    const req = { user: { id: 2, email: 'b@b.com', role: 'submitter' } }
    const res = mockRes()
    const next = jest.fn()

    // Act
    middleware(req, res, next)

    // Assert
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('permission') })
    )
  })

  test('returns 401 when req.user is not set (missing authenticate middleware)', () => {
    // Arrange
    const middleware = requireRole('admin')
    const req = {}           // no req.user
    const res = mockRes()
    const next = jest.fn()

    // Act
    middleware(req, res, next)

    // Assert
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  test('works for "submitter" role', () => {
    const middleware = requireRole('submitter')
    const req = { user: { role: 'submitter' } }
    const res = mockRes()
    const next = jest.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// errorHandler
// ────────────────────────────────────────────────────────────────────────────

const errorHandler = require('../middleware/errorHandler')

describe('errorHandler middleware', () => {
  test('returns the error status and message for known errors (status < 500)', () => {
    // Arrange
    const err = Object.assign(new Error('Resource not found.'), { status: 404 })
    const req = {}
    const res = mockRes()
    const next = jest.fn()

    // Act
    errorHandler(err, req, res, next)

    // Assert
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Resource not found.' })
  })

  test('returns 500 and generic message for unknown errors', () => {
    // Arrange
    const err = new Error('Internal crash')   // no .status
    const req = {}
    const res = mockRes()

    // Act
    errorHandler(err, req, res, jest.fn())

    // Assert
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('unexpected') })
    )
  })

  test('returns 400 for Multer LIMIT_FILE_SIZE error', () => {
    const err = Object.assign(new Error('file too large'), { code: 'LIMIT_FILE_SIZE' })
    const res = mockRes()

    errorHandler(err, {}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('10 MB') })
    )
  })

  test('returns 400 for Multer LIMIT_UNEXPECTED_FILE error', () => {
    const err = Object.assign(new Error('unexpected field'), { code: 'LIMIT_UNEXPECTED_FILE' })
    const res = mockRes()

    errorHandler(err, {}, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Unexpected file') })
    )
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 404 handler (mounted in app.js)
// ────────────────────────────────────────────────────────────────────────────

const request = require('supertest')
const app = require('../app')

describe('404 handler', () => {
  test('returns 404 JSON for an unknown route', async () => {
    const res = await request(app).get('/api/non-existent-route')
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})
