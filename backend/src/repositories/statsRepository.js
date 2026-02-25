'use strict'

const { getDb } = require('../db/database')

const SQL = {
  statusCounts: `
    SELECT status, COUNT(*) AS count
    FROM   ideas
    GROUP  BY status`,

  categoryCounts: `
    SELECT category, COUNT(*) AS count
    FROM   ideas
    GROUP  BY category
    ORDER  BY count DESC`,
}

/**
 * Returns aggregated idea statistics for the admin dashboard.
 * @returns {{
 *   totalIdeas: number,
 *   pendingReview: number,
 *   acceptedIdeas: number,
 *   rejectedIdeas: number,
 *   acceptanceRate: number,
 *   categoryCounts: Record<string, number>,
 *   mostPopularCategory: string | null
 * }}
 */
function getStats() {
  const db = getDb()

  // Status breakdown
  const statusRows = db.prepare(SQL.statusCounts).all()
  const byStatus = Object.fromEntries(statusRows.map(r => [r.status, r.count]))

  const totalIdeas     = statusRows.reduce((s, r) => s + r.count, 0)
  const acceptedIdeas  = byStatus.accepted    ?? 0
  const rejectedIdeas  = byStatus.rejected    ?? 0
  const pendingReview  = (byStatus.submitted  ?? 0) + (byStatus.under_review ?? 0)
  const acceptanceRate = totalIdeas > 0
    ? Math.round((acceptedIdeas / totalIdeas) * 100)
    : 0

  // Category breakdown
  const catRows = db.prepare(SQL.categoryCounts).all()
  const categoryCounts = Object.fromEntries(catRows.map(r => [r.category, r.count]))
  const mostPopularCategory = catRows.length > 0 ? catRows[0].category : null

  return {
    totalIdeas,
    pendingReview,
    acceptedIdeas,
    rejectedIdeas,
    acceptanceRate,
    categoryCounts,
    mostPopularCategory,
  }
}

module.exports = { getStats }
