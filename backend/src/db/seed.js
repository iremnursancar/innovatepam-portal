'use strict'

const bcrypt = require('bcryptjs')
const { runMigrations } = require('./migrate')
const { getDb, closeDb } = require('./database')
const { findByEmail, createUser } = require('../repositories/userRepository')

const BCRYPT_ROUNDS = 12

const ADMIN_EMAIL = 'admin@epam.com'
const ADMIN_PASSWORD = 'Admin123'
const ADMIN_ROLE = 'admin'

async function seed() {
  // Ensure schema is up to date before seeding
  runMigrations()

  const existing = findByEmail(ADMIN_EMAIL)
  if (existing) {
    console.log(`[seed] Admin user already exists (${ADMIN_EMAIL}). Skipping.`)
    return
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS)
  const admin = createUser({ email: ADMIN_EMAIL, password: hashed, role: ADMIN_ROLE })

  console.log(`[seed] Admin user created successfully.`)
  console.log(`       ID   : ${admin.id}`)
  console.log(`       Email: ${admin.email}`)
  console.log(`       Role : ${admin.role}`)
}

seed()
  .catch(err => {
    console.error('[seed] Error:', err.message)
    process.exitCode = 1
  })
  .finally(() => {
    closeDb()
  })
