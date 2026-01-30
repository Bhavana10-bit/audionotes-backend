import fs from 'fs'
import path from 'path'

const DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true'

/**
 * Transcribe an audio file using Deepgram REST API.
 * @param {string} filePath - Absolute or relative path to the audio file
 * @param {string} mimeType - e.g. audio/webm, audio/mpeg
 * @returns {Promise<string|null>} Transcript text or null if no key / error
 */
export async function transcribeWithDeepgram(filePath, mimeType) {
  const apiKey = (process.env.DEEPGRAM_API_KEY || '').trim().replace(/[;,]\s*$/, '')
  if (!apiKey) {
    console.warn('Transcription skipped: DEEPGRAM_API_KEY is missing in backend/.env. Add your key from https://console.deepgram.com')
    return null
  }

  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Audio file not found: ${absolutePath}`)
  }

  const buffer = fs.readFileSync(absolutePath)
  const contentType = mimeType || 'audio/wav'

  const res = await fetch(DEEPGRAM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': contentType,
    },
    body: buffer,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Deepgram API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? null
  return transcript
}
