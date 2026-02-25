'use strict'

const { verifyToken } = require('../utils/jwt')

/**
 * Express middleware that reads the JWT from the `token` httpOnly cookie,
 * verifies it, and attaches the decoded payload as `req.user`.
 *
 * Returns 401 if the cookie is absent or the token is invalid.
 */
function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' })
  }
}

module.exports = authenticate
