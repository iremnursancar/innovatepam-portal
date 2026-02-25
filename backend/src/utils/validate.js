'use strict'

/**
 * Checks that every named key in `fields` is present and non-empty in `body`.
 * Returns a 400 error if any field is missing.
 *
 * @param {object} body           req.body
 * @param {string[]} required     list of required field names
 */
function requireFields(body, required) {
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
      throw Object.assign(new Error(`Field '${field}' is required.`), { status: 400 })
    }
  }
}

module.exports = { requireFields }
