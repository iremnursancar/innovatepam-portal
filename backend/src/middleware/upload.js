'use strict'

const multer = require('multer')
const path = require('path')
const config = require('../config')

/** Allowed MIME types for uploaded attachments */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'image/png',
  'image/jpeg',
])

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.UPLOADS_PATH)
  },
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${unique}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      Object.assign(new Error('Invalid file type. Allowed: PDF, DOCX, XLSX, PNG, JPG.'), {
        status: 400,
      }),
      false
    )
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
})

module.exports = upload
