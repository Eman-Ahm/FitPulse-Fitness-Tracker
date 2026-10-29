# FitPulse — Progress Tracker

Keep this file updated after every step so context is never lost.

---

## ✅ Step 1 — Project structure, dependencies, schema (DONE)

### What was created
| Path | Description |
|------|-------------|
| `.gitignore` | Ignores node_modules, .env, dist, logs |
| `.env.example` | Placeholder env vars — copy to `.env` and fill in |
| `server/package.json` | Express + mysql2 + bcrypt + jwt + helmet + cors + rate-limit + express-validator |
| `server/index.js` | Express app entry point with middleware and route mounts |
| `server/config/db.js` | MySQL connection pool (mysql2/promise) |
| `server/middleware/auth.js` | JWT authenticateToken middleware |
| `server/middleware/errorHandler.js` | Centralized error handler |
| `server/routes/auth.js` | POST /api/auth/register, POST /api/auth/login |
| `server/routes/workouts.js` | Full CRUD routes (protected) |
| `server/routes/goals.js` | Full CRUD routes (protected) |
| `server/routes/analytics.js` | GET /api/analytics (protected) |
| `server/controllers/*.js` | Stub controllers (501 Not Implemented) |
| `server/validators/authValidators.js` | express-validator rules for register/login |
| `server/database/schema.sql` | Full DB schema: users, workouts, goals tables |
| `client/package.json` | React 18 + Vite 5 + React Router 6 + Recharts + Axios |
| `client/vite.config.js` | Vite config with /api proxy to port 5000 |
| `client/index.html` | HTML entry point |
| `client/.env.example` | VITE_API_BASE_URL placeholder |
| `client/src/main.jsx` | React entry, BrowserRouter |
| `client/src/App.jsx` | Route tree: public (login/register) + protected (layout) |
| `client/src/api/axios.js` | Axios instance with JWT interceptor + 401 redirect |
| `client/src/context/AuthContext.jsx` | Login/register/logout + localStorage persistence |
| `client/src/components/ProtectedRoute.jsx` | Redirects unauthenticated users to /login |
| `client/src/components/Layout.jsx` | Sidebar (desktop) + bottom nav (mobile) |
| `client/src/components/Layout.css` | Sidebar layout CSS |
| `client/src/styles/global.css` | Design tokens, utility classes |
| `client/src/pages/*.jsx` | Stub pages (501 placeholders) |

### Verified
- `node server/routes/auth.js` — loads OK
- `npm run build` in client — passes (104 modules, 228 kB)

---

## 🔲 Step 2 — Auth (NEXT)

### What to build
- `server/controllers/authController.js` — real register + login (bcrypt + JWT)
- `client/src/pages/LoginPage.jsx` — full login form
- `client/src/pages/RegisterPage.jsx` — full register form

### Commands to run after setup
```bash
# In server/ — create .env first (see below), then:
cd server
node index.js
# Expected: "✅ MySQL connected successfully" + "FitPulse server running on http://localhost:5000"
```

### Before running: set up the database
1. Open XAMPP Control Panel → Start Apache + MySQL
2. Open phpMyAdmin → http://localhost/phpmyadmin
3. Run `server/database/schema.sql` (Import tab, or paste in SQL tab)
4. Copy `.env.example` → `server/.env`, fill in DB_PASSWORD and generate JWT_SECRET:
   ```
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

---

## 🔲 Step 3 — Workouts CRUD
## 🔲 Step 4 — Goals CRUD
## 🔲 Step 5 — Dashboard & Analytics
## 🔲 Step 6 — Polish, README, submission
