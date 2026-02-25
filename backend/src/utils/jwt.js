'use strict'

const jwt = require('jsonwebtoken')
const config = require('../config')

const JWT_EXPIRY = '7d'

/**
 * Signs a JWT containing the given payload.
 * @param {{ id: number, email: string, role: string }} payload
 * @returns {string} Signed JWT string
 */
function signToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

/**
 * Verifies and decodes a JWT.
 * Throws `JsonWebTokenError` or `TokenExpiredError` on failure.
 * @param {string} token
 * @returns {{ id: number, email: string, role: string, iat: number, exp: number }}
 */
function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET)
}

module.exports = { signToken, verifyToken }
