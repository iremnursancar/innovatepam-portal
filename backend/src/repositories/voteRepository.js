'use strict'

const { getDb } = require('../db/database')

const SQL = {
  findVote: `
    SELECT id FROM idea_votes
    WHERE idea_id = ? AND user_id = ?`,

  insert: `
    INSERT OR IGNORE INTO idea_votes (idea_id, user_id) VALUES (?, ?)`,

  remove: `
    DELETE FROM idea_votes WHERE idea_id = ? AND user_id = ?`,

  countForIdea: `
    SELECT COUNT(*) AS count FROM idea_votes WHERE idea_id = ?`,

  // Returns one row per idea_id with its total count
  countForIdeas: `
    SELECT idea_id, COUNT(*) AS count
    FROM   idea_votes
    WHERE  idea_id IN (REPLACE_PLACEHOLDERS)
    GROUP  BY idea_id`,

  // Returns the idea_ids that the given user has voted on, scoped to a set
  userVotesForIdeas: `
    SELECT idea_id
    FROM   idea_votes
    WHERE  user_id = ?
      AND  idea_id IN (REPLACE_PLACEHOLDERS)`,
}

/**
 * Toggles a vote for the given user on the given idea.
 * Rejects votes on private ideas.
 * Returns { voteCount, hasVoted } after the toggle.
 * @param {number} ideaId
 * @param {number} userId
 * @returns {{ voteCount: number, hasVoted: boolean }}
 */
function toggleVote(ideaId, userId) {
  const db = getDb()

  // Guard: only public ideas can be voted
  const ideaRow = db.prepare('SELECT is_public FROM ideas WHERE id = ?').get(ideaId)
  if (!ideaRow) {
    throw Object.assign(new Error('Idea not found.'), { status: 404 })
  }
  if (!ideaRow.is_public) {
    throw Object.assign(new Error('You can only vote on public ideas.'), { status: 403 })
  }

  const existing = db.prepare(SQL.findVote).get(ideaId, userId)

  if (existing) {
    db.prepare(SQL.remove).run(ideaId, userId)
  } else {
    db.prepare(SQL.insert).run(ideaId, userId)
  }

  const { count } = db.prepare(SQL.countForIdea).get(ideaId)
  return { voteCount: count, hasVoted: !existing }
}

/**
 * Returns { voteCount, hasVoted } for a single idea.
 * @param {number} ideaId
 * @param {number} userId
 */
function getVoteInfo(ideaId, userId) {
  const db = getDb()
  const { count } = db.prepare(SQL.countForIdea).get(ideaId)
  const voted     = db.prepare(SQL.findVote).get(ideaId, userId)
  return { voteCount: count, hasVoted: !!voted }
}

/**
 * Enriches an array of idea rows with voteCount and hasVoted fields.
 * Uses only two queries regardless of how many ideas there are.
 * @param {Array<{ id: number }>} ideas
 * @param {number} userId
 */
function enrichWithVotes(ideas, userId) {
  if (!ideas.length) return ideas

  const db  = getDb()
  const ids = ideas.map(i => i.id)
  const placeholders = ids.map(() => '?').join(', ')

  const countRows = db
    .prepare(SQL.countForIdeas.replace('REPLACE_PLACEHOLDERS', placeholders))
    .all(...ids)
  const countMap = Object.fromEntries(countRows.map(r => [r.idea_id, r.count]))

  const votedRows = db
    .prepare(SQL.userVotesForIdeas.replace('REPLACE_PLACEHOLDERS', placeholders))
    .all(userId, ...ids)
  const votedSet = new Set(votedRows.map(r => r.idea_id))

  return ideas.map(idea => ({
    ...idea,
    voteCount: countMap[idea.id] ?? 0,
    hasVoted:  votedSet.has(idea.id),
  }))
}

module.exports = { toggleVote, getVoteInfo, enrichWithVotes }
