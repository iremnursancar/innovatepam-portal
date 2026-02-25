'use strict'

/**
 * Middleware factory that restricts access to users with the given role.
 * MUST be used AFTER the `authenticate` middleware.
 *
 * @param {'admin' | 'submitter'} role  Required role
 * @returns {import('express').RequestHandler}
 */
function requireRole(role) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' })
    }
    next()
  }
}

module.exports = requireRole
