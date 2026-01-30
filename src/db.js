import mongoose from 'mongoose'

export async function connectDb() {
  const uri = (process.env.MONGODB_URI || '').trim().replace(/[;,]\s*$/, '')
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Create backend/.env (see backend/.env.example).')
  }

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
}

