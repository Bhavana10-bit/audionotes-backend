#Speech-to-text

Upload or record audio, get transcriptions via Deepgram, and store them in MongoDB.

- **Frontend:** Vite + React + Tailwind CSS  
- **Backend:** Node.js + Express + Multer + MongoDB (Mongoose)  
- **Transcription:** Deepgram API (optional; set `DEEPGRAM_API_KEY` in backend)

---

## Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- [Deepgram](https://console.deepgram.com) API key (optional, for transcription)

---

## Project setup

### 1. Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

- `MONGODB_URI` – MongoDB connection string (required)
- `DEEPGRAM_API_KEY` – Deepgram API key (optional; transcriptions stay null without it)
- `PORT` – Server port (default `5000`)
- `FRONTEND_URL` – Production frontend URL (for CORS; optional)

```bash
npm install
npm run dev
```

Backend runs at **http://localhost:5000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**. It proxies `/api` and `/uploads` to the backend in development.

---

## API usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check; returns `ok`, `dbReady`, `transcriptionConfigured` |
| GET | `/api/uploads` | List uploads (newest first, max 50) |
| POST | `/api/uploads` | Upload audio (multipart field name: `audio`) |
| PATCH | `/api/uploads/:id` | Update display name: body `{ "originalName": "new name" }` |
| DELETE | `/api/uploads/:id` | Delete upload (file + DB document) |
| GET | `/uploads/:filename` | Stream stored audio file |

**Upload rules:** Field name `audio`; allowed types audio (MP3, WAV, WebM, OGG, etc.); max 25 MB.  
**Rename:** PATCH with JSON `{ "originalName": "..." }`; changes are stored in MongoDB.  
**Errors:** `400` (invalid file/name), `404` (not found), `503` (DB not connected).  

Full API and project details: **[DOCUMENTATION.md](./DOCUMENTATION.md)**.

---

## Deployment

### Backend (Render)

1. Push the repo; connect the **backend** folder (or repo root and set root to `backend`) on [Render](https://render.com).
2. Build: `npm install`  
   Start: `npm start`
3. Add environment variables: `MONGODB_URI`, `DEEPGRAM_API_KEY`, `FRONTEND_URL` (your frontend URL).
4. Render sets `PORT`; ensure the app uses `process.env.PORT`.

### Frontend (Netlify or Vercel)

1. Connect the **frontend** folder (or repo with root `frontend`) to [Netlify](https://netlify.com) or [Vercel](https://vercel.com).
2. Build command: `npm run build`  
   Publish directory: `dist`
3. Add environment variable: **`VITE_API_URL`** = your backend URL (e.g. `https://speakeasy-api.onrender.com`). No trailing slash.
4. Redeploy. The app will call the backend at `VITE_API_URL` and play audio from the same origin.

**CORS:** Set `FRONTEND_URL` on the backend to your deployed frontend URL (e.g. `https://speakeasy.netlify.app`) so the API allows requests from that origin.

---

## Verification and troubleshooting

- **Health:** Open `https://your-backend-url/api/health`.  
  `dbReady: true` = MongoDB connected; `transcriptionConfigured: true` = Deepgram key set.
- **How to check:** See [HOW_TO_CHECK.md](./HOW_TO_CHECK.md).
- **MongoDB:** See [backend/CONNECT_MONGODB.md](./backend/CONNECT_MONGODB.md).
- **Optional auth:** See [AUTH.md](./AUTH.md) for Supabase Auth and user-scoped transcriptions.

---

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| backend | `npm run dev` | Start with auto-restart |
| backend | `npm start` | Start once (production) |
| frontend | `npm run dev` | Dev server + proxy |
| frontend | `npm run build` | Production build to `dist` |

---## LicenseISC
