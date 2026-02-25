'use strict'

const bcrypt = require('bcryptjs')
const { findByEmail, createUser } = require('../repositories/userRepository')
const { signToken } = require('../utils/jwt')

const BCRYPT_ROUNDS = 12
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Registers a new user account.
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object, token: string }}
 * @throws {Error} with status 400 on validation failure
 * @throws {Error} with status 409 on duplicate email
 */
async function register(email, password) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw Object.assign(new Error('A valid email address is required.'), { status: 400 })
  }
  if (!password || password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400 })
  }

  const existing = findByEmail(email.toLowerCase())
  if (existing) {
    throw Object.assign(new Error('An account with this email already exists.'), { status: 409 })
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)
  const user = createUser({ email: email.toLowerCase(), password: hashed })
  const token = signToken({ id: user.id, email: user.email, role: user.role })

  return { user, token }
}

/**
 * Authenticates a user by email + password.
 * @param {string} email
 * @param {string} password
 * @returns {{ user: object, token: string }}
 * @throws {Error} with status 400 on missing fields
 * @throws {Error} with status 401 on invalid credentials
 */
async function login(email, password) {
  if (!email || !password) {
    throw Object.assign(new Error('Email and password are required.'), { status: 400 })
  }

  const user = findByEmail(email.toLowerCase())
  if (!user) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 })
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw Object.assign(new Error('Invalid email or password.'), { status: 401 })
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })
  // Return user without hashed password
  const { password: _pw, ...safeUser } = user
  return { user: safeUser, token }
}

module.exports = { register, login }
