'use strict'

/**
 * Centralised error-handling middleware.
 * Must be mounted LAST in the Express middleware chain.
 *
 * Handles:
 *  - Multer upload errors  → 400
 *  - Explicit status codes on error objects
 *  - All other errors      → 500
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[error]', err.message, err.stack)
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File exceeds the 10 MB size limit.' })
  }

  // Multer unexpected field
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field.' })
  }

  const status = typeof err.status === 'number' ? err.status : 500
  const message =
    status < 500
      ? err.message
      : 'An unexpected server error occurred. Please try again later.'

  return res.status(status).json({ error: message })
}

module.exports = errorHandler
