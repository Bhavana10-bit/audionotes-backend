import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

import { connectDb } from './db.js'
import uploadsRouter from './routes/uploads.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(backendRoot, '.env') })

const app = express()

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
)

app.get('/api/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1
  const transcriptionConfigured = !!(process.env.DEEPGRAM_API_KEY || '').trim().replace(/[;,]\s*$/, '')
  res.json({
    ok: true,
    dbReady,
    transcriptionConfigured,
    message: !transcriptionConfigured ? 'Add DEEPGRAM_API_KEY to backend/.env to enable transcription' : undefined,
  })
})

app.use('/uploads', express.static(path.join(backendRoot, 'uploads')))
app.use('/api/uploads', uploadsRouter)

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

const port = Number(process.env.PORT || 5000)

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`)
})

async function connectWithRetry() {
  try {
    await connectDb()
    console.log('Connected to MongoDB')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`MongoDB connection failed: ${msg}`)
    console.error('Backend is running, but upload/list endpoints will return 503 until MongoDB is available.')
    setTimeout(connectWithRetry, 3000)
  }
}

connectWithRetry()

