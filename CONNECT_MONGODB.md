# Connect MongoDB to the Backend Server

Your backend is already configured to use MongoDB; it just needs a **running MongoDB** and the correct **connection string** in `backend/.env`.

---

## 1. Connect to the backend server (run the app)

Use **two terminals**.

**Terminal 1 – Backend**
```bash
cd backend
npm run dev
```
- Backend runs at **http://localhost:5000**
- You should see either:
  - `Connected to MongoDB` (MongoDB is connected), or
  - `MongoDB connection failed: ...` (MongoDB not running or wrong URI)

**Terminal 2 – Frontend**
```bash
cd frontend
npm run dev
```
- Open in browser: **http://localhost:5173**
- The frontend talks to the backend via the proxy; uploads and list use the backend.

**Check backend + DB:**  
Open **http://localhost:5000/api/health** in the browser. You should see:
- `{"ok":true,"dbReady":true}` when MongoDB is connected
- `{"ok":true,"dbReady":false}` when the server is up but MongoDB is not connected

---

## 2. Connect MongoDB to the server (two options)

Your `backend/.env` has:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/speakeasy
```
That targets **local MongoDB** on your PC. Choose one of the following.

---

### Option A: Use MongoDB locally (on your PC)

**Step 1 – Install MongoDB**
- **Windows:** Download and run [MongoDB Community Server](https://www.mongodb.com/try/download/community). Choose “Complete” and **Install MongoDB as a Service** so it starts automatically.
- **macOS:** `brew tap mongodb/brew` then `brew install mongodb-community` then `brew services start mongodb-community`.

**Step 2 – Confirm it’s running**
- Windows: Open **Services** (Win + R → `services.msc`), find “MongoDB Server”, status should be “Running”.
- Or in a terminal: `mongosh` (or `mongo`) – if it connects, MongoDB is running.

**Step 3 – Keep your `.env` as is**
```env
MONGODB_URI=mongodb://127.0.0.1:27017/speakeasy
```

**Step 4 – Restart the backend**
```bash
cd backend
npm run dev
```
You should see **Connected to MongoDB** and **http://localhost:5000/api/health** should show `"dbReady":true`.

---

### Option B: Use MongoDB Atlas (free cloud – no local install)

**Step 1 – Create cluster and user**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. **Build a Database** → choose **FREE** (M0) → Create.
3. **Database Access** → **Add New Database User** → set username and password → **Add User**.
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0) for dev → **Confirm**.

**Step 2 – Get the connection string**
1. **Database** → **Connect** on your cluster.
2. **Connect your application** → copy the connection string (looks like):
   ```
   mongodb+srv://myuser:mypass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `myuser` and `mypass` with your database username and password. If the password has special characters (e.g. `#`, `@`), [URL-encode](https://www.urlencoder.org/) them.

**Step 3 – Set it in `backend/.env`**
Open `backend/.env` and set `MONGODB_URI` to your Atlas URI, with a database name (e.g. `speakeasy`) before the `?`:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/speakeasy?retryWrites=true&w=majority
```

**Step 4 – Restart the backend**
```bash
cd backend
npm run dev
```
You should see **Connected to MongoDB** and **http://localhost:5000/api/health** should show `"dbReady":true`.

---

## Quick checklist

| Step | Done |
|------|------|
| Backend running: `cd backend` → `npm run dev` | ☐ |
| MongoDB running (local) or Atlas URI in `backend/.env` | ☐ |
| `backend/.env` has `MONGODB_URI=...` (no typos, correct password) | ☐ |
| Health check: http://localhost:5000/api/health shows `"dbReady":true` | ☐ |
| Frontend: `cd frontend` → `npm run dev` → open http://localhost:5173 | ☐ |

If MongoDB still won’t connect, check:
- **Local:** Is the “MongoDB Server” service running? Can you run `mongosh`?
- **Atlas:** Is the IP allowlist 0.0.0.0/0 (or your IP)? Is the username/password in the URI correct and URL-encoded?
