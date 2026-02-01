import express from 'express'
import fs from 'fs'
import multer from 'multer'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

import { Upload } from '../models/Upload.js'
import { transcribeWithDeepgram } from '../services/transcribe.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..', '..')
const uploadsDir = path.join(backendRoot, 'uploads')

const router = express.Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '')
    const safeExt = ext && ext.length <= 10 ? ext : ''
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`
    cb(null, filename)
  },
})

const ALLOWED_MIMES = [
  'audio/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-wav',
  'audio/flac',
]
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase()
    const ok = mime.startsWith('audio/') || ALLOWED_MIMES.includes(mime)
    if (!ok) {
      return cb(new Error(`Invalid file type: ${file.mimetype}. Use audio files only (e.g. MP3, WAV, WebM).`))
    }
    cb(null, true)
  },
})

function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database not connected. Start MongoDB and/or check MONGODB_URI in backend/.env.',
    })
  }
  next()
}

router.get('/', async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database not connected. Start MongoDB and/or check MONGODB_URI in backend/.env.',
      })
    }
    const items = await Upload.find().sort({ createdAt: -1 }).limit(50).lean()
    res.json(
      items.map((it) => ({
        ...it,
        url: `/uploads/${it.storageFilename}`,
      }))
    )
  } catch (err) {
    next(err)
  }
})

router.post('/', requireDb, (req, res, next) => {
  upload.single('audio')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 25 MB.' })
      }
      return res.status(400).json({ error: err.message || 'Invalid file.' })
    }
    next()
  })
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing file field "audio".' })
    }

    const doc = await Upload.create({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageFilename: req.file.filename,
      storagePath: req.file.path,
      transcription: null,
    })

    let transcript = null
    const absolutePath = path.join(uploadsDir, req.file.filename)
    try {
      transcript = await transcribeWithDeepgram(absolutePath, req.file.mimetype)
      if (transcript) {
        doc.transcription = transcript
        await doc.save()
      }
    } catch (_err) {
      // Transcription failed; upload still succeeds with transcription: null
    }

    const out = doc.toObject()
    if (transcript) out.transcription = transcript

    res.status(201).json({
      ...out,
      url: `/uploads/${doc.storageFilename}`,
    })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', requireDb, async (req, res, next) => {
  try {
    const id = req.params.id
    const name = req.body?.originalName != null ? String(req.body.originalName).trim() : null
    if (!name || name.length === 0) {
      return res.status(400).json({ error: 'originalName is required and cannot be empty.' })
    }
    if (name.length > 255) {
      return res.status(400).json({ error: 'originalName must be at most 255 characters.' })
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid upload ID.' })
    }
    const doc = await Upload.findByIdAndUpdate(
      id,
      { originalName: name },
      { new: true, runValidators: true }
    ).lean()
    if (!doc) {
      return res.status(404).json({ error: 'Upload not found.' })
    }
    res.json({ ...doc, url: `/uploads/${doc.storageFilename}` })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireDb, async (req, res, next) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid upload ID.' })
    }
    const doc = await Upload.findById(id).lean()
    if (!doc) {
      return res.status(404).json({ error: 'Upload not found.' })
    }
    const filePath = path.join(uploadsDir, doc.storageFilename)
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (_err) {
      // ignore file delete errors
    }
    await Upload.findByIdAndDelete(id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

export default router

