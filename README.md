# ⚡ FitPulse — Full-Stack Fitness Tracker

> A professional fitness tracking web app built with React, Node.js, Express, and MySQL.
> Built for the CodeAlpha internship portfolio.

---

## ✅ Features (all tested and working)

### 🔐 Authentication & Security
- Register with name, email (gmail/yahoo/outlook validated), password (bcrypt cost 12)
- Login with JWT token (7-day expiry)
- Forgot password → single-use expiring token (prints to console if SMTP not configured)
- Reset password via secure link
- All protected routes return 401 without token
- No password hash ever returned in any API response

### 📊 Dashboard (Overview)
- 8 rotating hero images with auto-advance
- Motivational quote ticker
- Glassmorphism stat cards with animated counters
- **Real activity chart** (7/30/90 day toggle, duration/calories/workouts metric, fills missing days with 0)
- Food gallery with nutrition info
- Quick actions (8 buttons to every feature)
- Recent workouts list

### 🏋️ Workouts
- Full CRUD (create, read, update, delete)
- Fields: date, type, duration, calories, distance, notes
- Filter by type, sort by date/duration/calories
- Delete with confirmation
- **Export to CSV**

### 🎯 Goals
- Full CRUD
- Goal types: total workouts, duration, calories, distance, weight, custom
- Progress bars auto-calculated from real workout data
- Deadline tracking

### 💪 Exercise Library
- 20 default exercises auto-seeded on first visit (Upper Body, Cardio, HIIT, etc.)
- Search and filter by category
- Log exercise → creates workout entry with calorie estimate

### 🥗 Diet Planner
- Log meals by date (Breakfast/Lunch/Dinner/Snack)
- Daily macro totals (calories, protein, carbs, fat)
- Quick-add presets (6 common meals)
- Meal history grouped by type

### ⏱️ Workout Timer
- HIIT 30/10, Tabata, Boxing 3min, Custom presets
- SVG progress ring, round indicators
- Start / Pause / Reset

### 🏆 Achievements
- 14 auto-awarded badges (First Steps, Week Warrior, Calorie Burner, etc.)
- Earned/locked grid with progress bar
- "Check for new" button after workouts

### 📈 Analytics / Progress
- Weekly bar chart (duration + calories, last 8 weeks)
- Monthly line chart (frequency + duration, last 6 months)
- Pie chart by workout type
- All-time totals

### 📏 Body Measurements
- Log weight, body fat %, chest, waist, hips
- Weight-over-time line chart (appears after 2+ entries)

### 💧 Water Tracker
- Daily water intake with goal (2.5L default)
- Quick-add buttons (250/330/500/750 ml)
- Visual glass fill indicator
- Per-day history

### ⚖️ BMI Calculator
- Weight + height input
- BMI result with colour-coded scale
- Category (Underweight / Normal / Overweight / Obese)
- Healthy weight range calculation

### 👤 Profile
- Edit display name
- Change password (requires current password)
- Delete account (with password confirmation — cascades all data)

### 📱 Mobile
- Desktop: dark sidebar with section labels
- Mobile: top bar + hamburger menu + bottom navigation
- Responsive at all breakpoints

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6 |
| Charts | Recharts 2 |
| HTTP | Axios |
| Backend | Node.js 24, Express 4 |
| Database | MariaDB 10.4 via XAMPP |
| Auth | JWT (localStorage) + bcrypt (cost 12) |
| Validation | express-validator (server), inline JS (client) |
| Security | helmet, cors, express-rate-limit, body size limit |
| Email | nodemailer (console fallback in dev) |
| Tests | Jest + supertest |

---

## 📁 Folder Structure

```
FitPulse-Fitness-Tracker/
├── .env.example              ← placeholders only — copy to server/.env
├── .gitignore
├── README.md
├── PROGRESS.md
│
├── client/                   ← React + Vite
│   ├── src/
│   │   ├── api/              ← one file per resource
│   │   ├── components/       ← Layout, ProtectedRoute, ActivityChart
│   │   ├── context/          ← AuthContext
│   │   ├── pages/            ← 20 pages
│   │   ├── styles/           ← global.css (CSS variables, dark theme)
│   │   └── utils/            ← exportCsv.js
│   └── vite.config.js
│
└── server/
    ├── controllers/          ← 11 controllers
    ├── routes/               ← 10 route groups
    ├── validators/           ← auth, workout, goal validators
    ├── middleware/           ← auth.js (JWT), errorHandler.js
    ├── config/               ← db.js (mysql2 pool)
    ├── database/
    │   ├── schema.sql        ← 9 tables, safe to re-import
    │   └── migrations/       ← incremental migration files
    ├── scripts/
    │   └── verify-storage.js ← proof-of-storage (13/13 checks)
    ├── tests/
    │   └── api.test.js       ← 58 automated tests
    └── index.js
```

---

## ⚙️ Prerequisites

- **Node.js** 18+ (tested on 24) — https://nodejs.org
- **XAMPP** with MariaDB — https://www.apachefriends.org
- **Git** — https://git-scm.com

---

## 🚀 Windows Setup (XAMPP)

### 0. Clone the project

```powershell
git clone https://github.com/Eman-Ahm/FitPulse-Fitness-Tracker.git
cd FitPulse-Fitness-Tracker
```

### 1. Start MySQL

Open XAMPP Control Panel → click **Start** next to MySQL.

### 2. Import the database schema

1. Open http://localhost/phpmyadmin
2. Click **Import** tab
3. Choose file: `server/database/schema.sql`
4. Click **Go**

You should see the `fitpulse` database with 9 tables.

*If you already have an older schema (6 tables), run the migration instead:*
`server/database/migrations/002_add_body_water_resets.sql`

### 3. Configure environment

```powershell
Copy-Item ".env.example" "server\.env"
```

Open `server\.env` and set:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=fitpulse
DB_USER=root
DB_PASSWORD=          # blank for XAMPP default
JWT_SECRET=           # generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
# Optional SMTP (if blank, reset links print to server console)
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
```

### 4. Install dependencies

```powershell
cd server
npm install
cd ..\client
npm install
```

### 5. Run the app

**Terminal 1 — API server:**
```powershell
cd server
npm start
```
Expected: `✅ MySQL connected` + `FitPulse server running on http://localhost:5000`

**Terminal 2 — Frontend:**
```powershell
cd client
npm run dev
```
Open: **http://localhost:5173**

---

## 🧪 Testing

### Automated (58 tests)
```powershell
cd server
npm test
```
Expected: `Tests: 58 passed, 58 total`

### Storage proof (requires server running)
```powershell
cd server
node scripts/verify-storage.js
```
Expected: `13/13 checks passed`

### Production build
```powershell
cd client
npx vite build
```
Expected: `✓ built in ~12s, 941 modules, 0 errors`

---

## 📡 API Overview

All routes except `/api/auth/*` and `/api/health` require:
```
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Request reset link |
| POST | `/api/auth/reset-password` | Set new password |
| GET  | `/api/workouts` | List workouts (filter/sort) |
| POST/PUT/DELETE | `/api/workouts/:id` | CRUD |
| GET  | `/api/goals` | List goals (auto-computed progress) |
| POST/PUT/DELETE | `/api/goals/:id` | CRUD |
| GET  | `/api/analytics` | Weekly/monthly summary |
| GET  | `/api/analytics/daily?days=7` | Daily chart data |
| GET  | `/api/exercises` | Exercise library |
| POST | `/api/exercises/:id/log` | Log exercise as workout |
| GET/POST/DELETE | `/api/meals` | Meal tracking |
| GET/POST/DELETE | `/api/measurements` | Body measurements |
| GET/POST/DELETE | `/api/water` | Water intake |
| GET/POST | `/api/achievements` | Badges |
| POST | `/api/achievements/check` | Award new badges |
| GET/PUT/DELETE | `/api/profile` | Profile management |
| GET | `/api/health` | Server + DB status |

---

## 🔒 Security Notes

- **JWT in localStorage**: convenient for local dev but XSS-accessible. For production, use httpOnly cookies.
- **Passwords**: bcrypt (cost 12), never returned in any response.
- **Rate limiting**: 20 requests / 15 min on auth routes.
- **CORS**: restricted to `CLIENT_URL` env variable.
- **Body limit**: 50 KB to prevent large-payload attacks.
- **SQL injection**: all queries use `?` parameterized placeholders.

---

## ⚠️ Known Limitations

- JWT in localStorage (documented tradeoff above)
- No HTTPS in development (use reverse proxy for production)
- No email verification on register
- Bundle size ~754 KB (Recharts + Lodash — cosmetic warning only)
- Photos hotlinked from Unsplash (download to `client/public/images/` for production)

---

## 🚀 Deployment (overview)

For production:

| Service | Recommended |
|---------|-------------|
| Frontend | Vercel or Netlify (`npm run build` → deploy `dist/`) |
| Backend | Render or Railway (Node.js web service) |
| Database | PlanetScale, Aiven, or Railway MySQL |

Key steps:
1. Set all env vars as secrets on your host (never commit `.env`)
2. Set `NODE_ENV=production`
3. Set `CLIENT_URL` to your production frontend domain
4. Switch from localStorage JWT to httpOnly cookies
5. Enable HTTPS (all platforms do this automatically)
6. Update CORS to allow only your production domain

---

## 📄 Legal

`/privacy` — Privacy Policy template (⚠️ review with lawyer before going commercial)
`/terms` — Terms of Service template (⚠️ review with lawyer before going commercial)

---

## 👩‍💻 Author

**Eman Ahmed**
GitHub: [Eman-Ahm](https://github.com/Eman-Ahm)

---

## 🙏 Credits

- Fitness photos: [Unsplash](https://unsplash.com) (free for commercial use)
- Font: Inter (Google Fonts, SIL Open Font License)
- Charts: [Recharts](https://recharts.org)
