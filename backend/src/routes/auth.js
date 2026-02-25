'use strict'

const { Router } = require('express')
const { register, login } = require('../services/authService')
const authenticate = require('../middleware/authenticate')
const { findById, updateUserRole } = require('../repositories/userRepository')

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}

/**
 * POST /api/auth/register
 * Body: { email, password }
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { user, token } = await register(email, password)
    res.cookie('token', token, COOKIE_OPTIONS)
    return res.status(201).json({ user })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const { user, token } = await login(email, password)
    res.cookie('token', token, COOKIE_OPTIONS)
    return res.json({ user })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/logout
 * Clears the auth cookie.
 */
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' })
  return res.json({ message: 'Logged out successfully.' })
})

/**
 * POST /api/auth/make-admin  (TEMPORARY - setup only, no auth required)
 * Body: { email: string }
 * Promotes the given user to the 'admin' role.
 */
router.post('/make-admin', (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ error: 'email is required.' })
  }
  const user = updateUserRole(email, 'admin')
  if (!user) {
    return res.status(404).json({ error: 'User not found.' })
  }
  return res.json({ message: `User ${email} promoted to admin.`, user })
})

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
router.get('/me', authenticate, (req, res) => {
  const user = findById(req.user.id)
  if (!user) {
    return res.status(401).json({ error: 'User not found.' })
  }
  return res.json({ user })
})

module.exports = router
