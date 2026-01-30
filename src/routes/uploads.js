import express from 'express'
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

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
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

router.post('/', requireDb, upload.single('audio'), async (req, res, next) => {
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
      } else {
        console.warn('No transcription returned. Add DEEPGRAM_API_KEY to backend/.env and get a key from https://console.deepgram.com')
      }
    } catch (err) {
      console.error('Transcription failed:', err.message)
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

export default router

