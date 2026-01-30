import mongoose from 'mongoose'

const UploadSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageFilename: { type: String, required: true },
    storagePath: { type: String, required: true },
    transcription: { type: String, default: null },
  },
  { timestamps: true }
)

export const Upload = mongoose.model('Upload', UploadSchema)

